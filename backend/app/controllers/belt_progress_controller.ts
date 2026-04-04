import type { HttpContext } from '@adonisjs/core/http'
import emitter from '@adonisjs/core/services/emitter'
import { DateTime } from 'luxon'
import Enrollment from '#models/enrollment'
import BeltProgress from '#models/belt_progress'
import BeltPolicy from '#policies/belt_policy'
import BeltAwarded from '#events/belt_awarded'
import { AuditLogService } from '#services/audit_log_service'
import { awardBeltValidator } from '#validators/belt_validator'

export default class BeltProgressController {
  /**
   * POST /api/v1/enrollments/:enrollmentId/belts
   * Award a belt to an enrolled student.
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

    // Check teacher owns the class
    if (user.profileType !== 'teacher' || enrollment.class.teacherId !== user.id) {
      return response.status(403).send({ error: { message: 'Forbidden' } })
    }

    // Check belt system enabled
    if (!enrollment.class.hasBeltSystem) {
      return response
        .status(422)
        .send({ error: { message: 'This class does not use a belt system' } })
    }

    const data = await request.validateUsing(awardBeltValidator)

    // Validate awarded_at is not in the future
    const awardedAt = DateTime.fromJSDate(data.awarded_at)
    if (awardedAt > DateTime.now()) {
      return response
        .status(422)
        .send({ error: { message: 'Awarded date cannot be in the future' } })
    }

    const belt = await BeltProgress.create({
      enrollmentId: enrollment.id,
      beltName: data.belt_name,
      awardedAt,
      awardedBy: user.id,
    })

    await AuditLogService.log(user.id, 'belt_awarded', 'belt_progress', {
      resourceId: belt.id,
      ipAddress: request.ip(),
      metadata: {
        enrollment_id: enrollment.id,
        class_id: enrollment.classId,
        belt_name: data.belt_name,
      },
    })

    await emitter.emit(
      BeltAwarded,
      new BeltAwarded(belt, enrollment.studentId, data.belt_name, enrollment.class.name)
    )

    return response.status(201).send({
      id: belt.id,
      belt_name: belt.beltName,
      awarded_at: belt.awardedAt,
      awarded_by: { first_name: user.firstName },
    })
  }

  /**
   * GET /api/v1/enrollments/:enrollmentId/belts
   * Belt history sorted by awarded_at asc.
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

    if (!(await BeltPolicy.view(user, enrollment))) {
      return response.status(403).send({ error: { message: 'Forbidden' } })
    }

    const belts = await BeltProgress.query()
      .where('enrollment_id', enrollment.id)
      .preload('awarder')
      .orderBy('awarded_at', 'asc')

    return response.status(200).send(
      belts.map((b) => ({
        id: b.id,
        belt_name: b.beltName,
        awarded_at: b.awardedAt,
        awarded_by: { first_name: b.awarder.firstName },
      }))
    )
  }
}
