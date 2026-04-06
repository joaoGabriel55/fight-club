import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import Class from '#models/class'
import ClassSchedule from '#models/class_schedule'
import Enrollment from '#models/enrollment'
import { AuditLogService } from '#services/audit_log_service'
import { createClassValidator, updateClassValidator } from '#validators/class_validator'

/**
 * Returns true if endTime represents a moment strictly after startTime.
 * Expects HH:MM or H:MM string format.
 */
function isEndAfterStart(startTime: string, endTime: string): boolean {
  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + (m ?? 0)
  }
  return toMinutes(endTime) > toMinutes(startTime)
}

export default class ClassesController {
  /**
   * POST /api/v1/classes
   */
  async store({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    if (user.profileType !== 'teacher') {
      return response.status(403).send({ error: { message: 'Forbidden' } })
    }

    const data = await request.validateUsing(createClassValidator)

    // Cross-field time validation for each schedule
    for (const schedule of data.schedules) {
      if (!isEndAfterStart(schedule.start_time, schedule.end_time)) {
        return response.status(422).send({
          error: {
            message: 'Validation failed',
            fields: [{ field: 'schedules.end_time', message: 'end_time must be after start_time' }],
          },
        })
      }
    }

    const classId = await db.transaction(async (trx) => {
      const cls = await Class.create(
        {
          teacherId: user.id,
          name: data.name,
          martialArt: data.martial_art,
          hasBeltSystem: data.has_belt_system,
          description: data.description ?? null,
        },
        { client: trx }
      )

      await ClassSchedule.createMany(
        data.schedules.map((s) => ({
          classId: cls.id,
          dayOfWeek: s.day_of_week,
          startTime: s.start_time,
          endTime: s.end_time,
        })),
        { client: trx }
      )

      return cls.id
    })

    // Reload from DB so time values are normalised to the PostgreSQL format (HH:MM:SS)
    const classRecord = await Class.query().where('id', classId).preload('schedules').firstOrFail()

    await AuditLogService.log(user.id, 'class_created', 'class', {
      resourceId: classRecord.id,
      ipAddress: request.ip(),
    })

    return response.status(201).send({
      id: classRecord.id,
      name: classRecord.name,
      martial_art: classRecord.martialArt,
      has_belt_system: classRecord.hasBeltSystem,
      description: classRecord.description,
      created_at: classRecord.createdAt,
      schedules: classRecord.schedules.map((s) => ({
        id: s.id,
        day_of_week: s.dayOfWeek,
        start_time: s.startTime,
        end_time: s.endTime,
      })),
    })
  }

  /**
   * GET /api/v1/classes
   */
  async index({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    if (user.profileType !== 'teacher') {
      return response.status(403).send({ error: { message: 'Forbidden' } })
    }

    const page = Number(request.input('page', 1))
    const perPage = Number(request.input('per_page', 20))

    const paginated = await Class.query()
      .where('teacher_id', user.id)
      .whereNull('deleted_at')
      .withCount('schedules')
      .withCount('enrollments', (q) => q.where('status', 'active'))
      .orderBy('created_at', 'desc')
      .paginate(page, perPage)

    return response.status(200).send({
      data: paginated.all().map((cls) => ({
        id: cls.id,
        name: cls.name,
        martial_art: cls.martialArt,
        has_belt_system: cls.hasBeltSystem,
        description: cls.description,
        schedule_count: Number(cls.$extras.schedules_count),
        enrollment_count: Number(cls.$extras.enrollments_count),
        created_at: cls.createdAt,
      })),
      meta: {
        total: paginated.total,
        page: paginated.currentPage,
        per_page: paginated.perPage,
      },
    })
  }

  /**
   * GET /api/v1/classes/:id
   */
  async show({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const cls = await Class.query()
      .where('id', params.id)
      .whereNull('deleted_at')
      .preload('schedules')
      .first()

    if (!cls) {
      return response.status(404).send({ error: { message: 'Not found' } })
    }

    // Teacher must own the class; student must be enrolled
    if (user.profileType === 'teacher') {
      if (cls.teacherId !== user.id) {
        return response.status(403).send({ error: { message: 'Forbidden' } })
      }
    } else {
      const enrollment = await Enrollment.query()
        .where('class_id', cls.id)
        .where('student_id', user.id)
        .where('status', 'active')
        .first()
      if (!enrollment) {
        return response.status(403).send({ error: { message: 'Forbidden' } })
      }
    }

    return response.status(200).send({
      id: cls.id,
      name: cls.name,
      martial_art: cls.martialArt,
      has_belt_system: cls.hasBeltSystem,
      description: cls.description,
      created_at: cls.createdAt,
      schedules: cls.schedules.map((s) => ({
        id: s.id,
        day_of_week: s.dayOfWeek,
        start_time: s.startTime,
        end_time: s.endTime,
      })),
    })
  }

  /**
   * PUT /api/v1/classes/:id
   */
  async update({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    if (user.profileType !== 'teacher') {
      return response.status(403).send({ error: { message: 'Forbidden' } })
    }

    const cls = await Class.query().where('id', params.id).whereNull('deleted_at').first()

    if (!cls) {
      return response.status(404).send({ error: { message: 'Not found' } })
    }

    if (cls.teacherId !== user.id) {
      return response.status(403).send({ error: { message: 'Forbidden' } })
    }

    const data = await request.validateUsing(updateClassValidator)

    if (data.name !== undefined) cls.name = data.name
    if (data.martial_art !== undefined) cls.martialArt = data.martial_art
    if (data.has_belt_system !== undefined) cls.hasBeltSystem = data.has_belt_system
    if (data.description !== undefined) cls.description = data.description ?? null

    await cls.save()

    await AuditLogService.log(user.id, 'class_updated', 'class', {
      resourceId: cls.id,
      ipAddress: request.ip(),
    })

    return response.status(200).send({
      id: cls.id,
      name: cls.name,
      martial_art: cls.martialArt,
      has_belt_system: cls.hasBeltSystem,
      description: cls.description,
      created_at: cls.createdAt,
    })
  }

  /**
   * DELETE /api/v1/classes/:id
   * Soft-deletes the class by setting deleted_at.
   */
  async destroy({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    if (user.profileType !== 'teacher') {
      return response.status(403).send({ error: { message: 'Forbidden' } })
    }

    const cls = await Class.query().where('id', params.id).whereNull('deleted_at').first()

    if (!cls) {
      return response.status(404).send({ error: { message: 'Not found' } })
    }

    if (cls.teacherId !== user.id) {
      return response.status(403).send({ error: { message: 'Forbidden' } })
    }

    cls.deletedAt = DateTime.now()
    await cls.save()

    await AuditLogService.log(user.id, 'class_deleted', 'class', {
      resourceId: cls.id,
      ipAddress: request.ip(),
    })

    return response.status(204).send(null)
  }

  /**
   * GET /api/v1/classes/:id/students
   * Returns enrolled students with weight, height, and belt info.
   */
  async students({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()

    if (user.profileType !== 'teacher') {
      return response.status(403).send({ error: { message: 'Forbidden' } })
    }

    const cls = await Class.query().where('id', params.id).whereNull('deleted_at').first()

    if (!cls) {
      return response.status(404).send({ error: { message: 'Not found' } })
    }

    if (cls.teacherId !== user.id) {
      return response.status(403).send({ error: { message: 'Forbidden' } })
    }

    const enrollments = await Enrollment.query()
      .where('class_id', cls.id)
      .where('status', 'active')
      .preload('student', (q) => q.preload('studentProfile'))
      .preload('beltProgress', (q) => q.orderBy('awarded_at', 'desc').limit(1))
      .orderBy('joined_at', 'asc')

    return response.status(200).send(
      enrollments.map((enr) => ({
        id: enr.studentId,
        enrollment_id: enr.id,
        first_name: enr.student.firstName,
        birth_date: enr.student.birthDate,
        enrolled_at: enr.joinedAt,
        weight_kg: enr.student.studentProfile?.weightKg ?? null,
        height_cm: enr.student.studentProfile?.heightCm ?? null,
        fight_experience: enr.student.studentProfile?.fightExperience ?? null,
        belt_level: enr.beltProgress[0]?.beltName ?? null,
      }))
    )
  }
}
