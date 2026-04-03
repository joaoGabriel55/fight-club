import type { HttpContext } from '@adonisjs/core/http'
import emitter from '@adonisjs/core/services/emitter'
import Enrollment from '#models/enrollment'
import Feedback from '#models/feedback'
import FeedbackPolicy from '#policies/feedback_policy'
import FeedbackSent from '#events/feedback_sent'
import { AuditLogService } from '#services/audit_log_service'
import { createFeedbackValidator } from '#validators/feedback_validator'

export default class FeedbackController {
  /**
   * POST /api/v1/enrollments/:enrollmentId/feedback
   * Teacher sends feedback to an enrolled student.
   */
  async store({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const enrollment = await Enrollment.query()
      .where('id', params.enrollmentId)
      .where('status', 'active')
      .preload('class')
      .first()

    if (!enrollment) {
      return response.status(404).send({ error: { message: 'Not found' } })
    }

    if (!(await FeedbackPolicy.create(user, enrollment))) {
      return response.status(403).send({ error: { message: 'Forbidden' } })
    }

    const data = await request.validateUsing(createFeedbackValidator)

    const feedback = await Feedback.create({
      enrollmentId: enrollment.id,
      teacherId: user.id,
      content: data.content,
    })

    await AuditLogService.log(user.id, 'feedback_sent', 'feedback', {
      resourceId: feedback.id,
      ipAddress: request.ip(),
      metadata: { enrollment_id: enrollment.id, class_id: enrollment.classId },
    })

    await emitter.emit(
      FeedbackSent,
      new FeedbackSent(feedback, enrollment.studentId, user.firstName, enrollment.class.name)
    )

    return response.status(201).send({
      id: feedback.id,
      content: data.content,
      teacher: { first_name: user.firstName },
      created_at: feedback.createdAt,
    })
  }

  /**
   * GET /api/v1/enrollments/:enrollmentId/feedback
   * List feedback for an enrollment (teacher or enrolled student).
   */
  async index({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const enrollment = await Enrollment.query()
      .where('id', params.enrollmentId)
      .where('status', 'active')
      .first()

    if (!enrollment) {
      return response.status(404).send({ error: { message: 'Not found' } })
    }

    if (!(await FeedbackPolicy.view(user, enrollment))) {
      return response.status(403).send({ error: { message: 'Forbidden' } })
    }

    const feedbackList = await Feedback.query()
      .where('enrollment_id', enrollment.id)
      .preload('teacher')
      .orderBy('created_at', 'desc')

    await AuditLogService.log(user.id, 'feedback_viewed', 'feedback', {
      ipAddress: '',
      metadata: { enrollment_id: enrollment.id },
    })

    return response.status(200).send(
      feedbackList.map((f) => ({
        id: f.id,
        content: f.content,
        teacher: { first_name: f.teacher.firstName },
        created_at: f.createdAt,
      }))
    )
  }

  /**
   * GET /api/v1/feedback
   * Student view: all feedback across all enrollments.
   * Teacher calling this → 403.
   */
  async myFeedback({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    if (user.profileType === 'teacher') {
      return response.status(403).send({ error: { message: 'Forbidden' } })
    }

    const enrollments = await Enrollment.query()
      .where('student_id', user.id)
      .where('status', 'active')

    const enrollmentIds = enrollments.map((e) => e.id)

    if (enrollmentIds.length === 0) {
      return response.status(200).send([])
    }

    const feedbackList = await Feedback.query()
      .whereIn('enrollment_id', enrollmentIds)
      .preload('teacher')
      .preload('enrollment', (q) => q.preload('class'))
      .orderBy('created_at', 'desc')

    return response.status(200).send(
      feedbackList.map((f) => ({
        id: f.id,
        content: f.content,
        teacher: { first_name: f.teacher.firstName },
        class_name: f.enrollment.class.name,
        class_id: f.enrollment.classId,
        enrollment_id: f.enrollmentId,
        created_at: f.createdAt,
      }))
    )
  }
}
