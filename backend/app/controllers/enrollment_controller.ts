import type { HttpContext } from '@adonisjs/core/http'
import emitter from '@adonisjs/core/services/emitter'
import { DateTime } from 'luxon'
import Class from '#models/class'
import Invitation from '#models/invitation'
import Enrollment from '#models/enrollment'
import StudentEnrolled from '#events/student_enrolled'
import { AuditLogService } from '#services/audit_log_service'
import { joinClassValidator } from '#validators/invitation_validator'

export default class EnrollmentController {
  /**
   * GET /api/v1/invitations/:token/class
   * Public: return class name + martial art from an invite token (no auth required).
   * Used by the frontend /join/:token page before the user is authenticated.
   */
  async classFromToken({ params, response }: HttpContext) {
    const invitation = await Invitation.query()
      .where('token', params.token)
      .preload('class', (q) => q.preload('teacher'))
      .first()

    if (!invitation || !invitation.isActive || invitation.expiresAt <= DateTime.now()) {
      return response
        .status(410)
        .send({ error: { message: 'This invitation is invalid or has expired' } })
    }

    if (invitation.maxUses !== null && invitation.useCount >= invitation.maxUses) {
      return response
        .status(410)
        .send({ error: { message: 'This invitation has reached its maximum number of uses' } })
    }

    return response.status(200).send({
      class_name: invitation.class.name,
      martial_art: invitation.class.martialArt,
      teacher_first_name: invitation.class.teacher.firstName,
    })
  }

  /**
   * POST /api/v1/join/:token
   * Join a class via invite token.
   */
  async join({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    // Teachers cannot enroll as students
    if (user.profileType !== 'student') {
      return response
        .status(403)
        .send({ error: { message: 'Teachers cannot join classes as students' } })
    }

    const invitation = await Invitation.query()
      .where('token', params.token)
      .preload('class')
      .first()

    if (!invitation) {
      return response
        .status(410)
        .send({ error: { message: 'This invitation is invalid or has expired' } })
    }

    // Check active + not expired
    if (!invitation.isActive || invitation.expiresAt <= DateTime.now()) {
      return response
        .status(410)
        .send({ error: { message: 'This invitation is invalid or has expired' } })
    }

    // Check max uses
    if (invitation.maxUses !== null && invitation.useCount >= invitation.maxUses) {
      return response
        .status(410)
        .send({ error: { message: 'This invitation has reached its maximum number of uses' } })
    }

    // Check duplicate enrollment
    const existing = await Enrollment.query()
      .where('class_id', invitation.classId)
      .where('student_id', user.id)
      .first()

    if (existing) {
      return response
        .status(409)
        .send({ error: { message: 'You are already enrolled in this class' } })
    }

    // Validate consent
    await request.validateUsing(joinClassValidator)

    const now = DateTime.now()
    const enrollment = await Enrollment.create({
      classId: invitation.classId,
      studentId: user.id,
      status: 'active',
      joinedAt: now,
      leftAt: null,
      dataConsentAt: now,
    })

    // Increment use_count
    invitation.useCount += 1
    await invitation.save()

    await AuditLogService.log(user.id, 'student_enrolled', 'enrollment', {
      resourceId: enrollment.id,
      ipAddress: request.ip(),
      metadata: { class_id: invitation.classId },
    })

    // Emit event — fire and forget (listener is async)
    await emitter.emit(
      StudentEnrolled,
      new StudentEnrolled(
        enrollment,
        invitation.class.teacherId,
        user.firstName,
        invitation.class.name
      )
    )

    return response.status(201).send({
      id: enrollment.id,
      class_id: enrollment.classId,
      student_id: enrollment.studentId,
      status: enrollment.status,
      joined_at: enrollment.joinedAt,
      data_consent_at: enrollment.dataConsentAt,
    })
  }

  /**
   * GET /api/v1/enrollments
   * List the authenticated student's active enrollments.
   */
  async index({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const enrollments = await Enrollment.query()
      .where('student_id', user.id)
      .where('status', 'active')
      .preload('class', (query) => {
        query.preload('schedules').preload('teacher')
      })
      .orderBy('joined_at', 'desc')

    return response.status(200).send(
      enrollments.map((enr) => ({
        id: enr.id,
        class_id: enr.classId,
        status: enr.status,
        joined_at: enr.joinedAt,
        data_consent_at: enr.dataConsentAt,
        class: {
          id: enr.class.id,
          name: enr.class.name,
          martial_art: enr.class.martialArt,
          has_belt_system: enr.class.hasBeltSystem,
          description: enr.class.description,
          teacher_first_name: enr.class.teacher.firstName,
          schedules: enr.class.schedules.map((s) => ({
            id: s.id,
            day_of_week: s.dayOfWeek,
            start_time: s.startTime,
            end_time: s.endTime,
          })),
        },
      }))
    )
  }

  /**
   * DELETE /api/v1/enrollments/:id
   * Leave a class — hard-deletes enrollment + cascade data.
   */
  async leave({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const enrollment = await Enrollment.query().where('id', params.id).first()

    if (!enrollment) {
      return response.status(404).send({ error: { message: 'Not found' } })
    }

    if (enrollment.studentId !== user.id) {
      return response.status(403).send({ error: { message: 'Forbidden' } })
    }

    // Hard delete: remove enrollment row.
    // When feedback/belt_progress tables are added in future tickets, delete them here too
    // (before deleting the enrollment row to satisfy FK constraints).
    await enrollment.delete()

    await AuditLogService.log(user.id, 'student_left', 'enrollment', {
      resourceId: params.id,
      ipAddress: request.ip(),
      metadata: { class_id: enrollment.classId },
    })

    return response.status(204).send(null)
  }

  /**
   * DELETE /api/v1/classes/:classId/students/:enrollmentId
   * Remove a student from a class (teacher only).
   */
  async removeStudent({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    if (user.profileType !== 'teacher') {
      return response.status(403).send({ error: { message: 'Forbidden' } })
    }

    const cls = await Class.query().where('id', params.classId).whereNull('deleted_at').first()

    if (!cls) {
      return response.status(404).send({ error: { message: 'Class not found' } })
    }

    if (cls.teacherId !== user.id) {
      return response.status(403).send({ error: { message: 'Forbidden' } })
    }

    const enrollment = await Enrollment.query()
      .where('id', params.enrollmentId)
      .where('class_id', cls.id)
      .where('status', 'active')
      .first()

    if (!enrollment) {
      return response.status(404).send({ error: { message: 'Enrollment not found' } })
    }

    await enrollment.delete()

    await AuditLogService.log(user.id, 'student_removed', 'enrollment', {
      resourceId: params.enrollmentId,
      ipAddress: request.ip(),
      metadata: { class_id: cls.id, student_id: enrollment.studentId },
    })

    return response.status(204).send(null)
  }
}
