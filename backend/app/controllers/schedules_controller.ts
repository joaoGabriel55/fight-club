import type { HttpContext } from '@adonisjs/core/http'
import Class from '#models/class'
import ClassSchedule from '#models/class_schedule'
import { createScheduleValidator, updateScheduleValidator } from '#validators/class_validator'

/**
 * Returns true if endTime is strictly after startTime.
 * Expects HH:MM or H:MM string format.
 */
function isEndAfterStart(startTime: string, endTime: string): boolean {
  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + (m ?? 0)
  }
  return toMinutes(endTime) > toMinutes(startTime)
}

export default class SchedulesController {
  /**
   * POST /api/v1/classes/:classId/schedules
   */
  async store({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    if (user.profileType !== 'teacher') {
      return response.status(403).send({ error: { message: 'Forbidden' } })
    }

    const cls = await Class.query().where('id', params.classId).whereNull('deleted_at').first()

    if (!cls) {
      return response.status(404).send({ error: { message: 'Not found' } })
    }

    if (cls.teacherId !== user.id) {
      return response.status(403).send({ error: { message: 'Forbidden' } })
    }

    const data = await request.validateUsing(createScheduleValidator)

    if (!isEndAfterStart(data.start_time, data.end_time)) {
      return response.status(422).send({
        error: {
          message: 'Validation failed',
          fields: [{ field: 'end_time', message: 'end_time must be after start_time' }],
        },
      })
    }

    const schedule = await ClassSchedule.create({
      classId: cls.id,
      dayOfWeek: data.day_of_week,
      startTime: data.start_time,
      endTime: data.end_time,
    })

    return response.status(201).send({
      id: schedule.id,
      class_id: schedule.classId,
      day_of_week: schedule.dayOfWeek,
      start_time: schedule.startTime,
      end_time: schedule.endTime,
    })
  }

  /**
   * PUT /api/v1/classes/:classId/schedules/:id
   */
  async update({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    if (user.profileType !== 'teacher') {
      return response.status(403).send({ error: { message: 'Forbidden' } })
    }

    const cls = await Class.query().where('id', params.classId).whereNull('deleted_at').first()

    if (!cls) {
      return response.status(404).send({ error: { message: 'Not found' } })
    }

    if (cls.teacherId !== user.id) {
      return response.status(403).send({ error: { message: 'Forbidden' } })
    }

    const schedule = await ClassSchedule.query()
      .where('id', params.id)
      .where('class_id', params.classId)
      .first()

    if (!schedule) {
      return response.status(404).send({ error: { message: 'Not found' } })
    }

    const data = await request.validateUsing(updateScheduleValidator)

    if (data.day_of_week !== undefined) schedule.dayOfWeek = data.day_of_week
    if (data.start_time !== undefined) schedule.startTime = data.start_time
    if (data.end_time !== undefined) schedule.endTime = data.end_time

    // Re-validate time ordering with the effective values after update
    const effectiveStart = data.start_time ?? schedule.startTime
    const effectiveEnd = data.end_time ?? schedule.endTime
    if (!isEndAfterStart(effectiveStart, effectiveEnd)) {
      return response.status(422).send({
        error: {
          message: 'Validation failed',
          fields: [{ field: 'end_time', message: 'end_time must be after start_time' }],
        },
      })
    }

    await schedule.save()

    return response.status(200).send({
      id: schedule.id,
      class_id: schedule.classId,
      day_of_week: schedule.dayOfWeek,
      start_time: schedule.startTime,
      end_time: schedule.endTime,
    })
  }

  /**
   * DELETE /api/v1/classes/:classId/schedules/:id
   */
  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()

    if (user.profileType !== 'teacher') {
      return response.status(403).send({ error: { message: 'Forbidden' } })
    }

    const cls = await Class.query().where('id', params.classId).whereNull('deleted_at').first()

    if (!cls) {
      return response.status(404).send({ error: { message: 'Not found' } })
    }

    if (cls.teacherId !== user.id) {
      return response.status(403).send({ error: { message: 'Forbidden' } })
    }

    const schedule = await ClassSchedule.query()
      .where('id', params.id)
      .where('class_id', params.classId)
      .first()

    if (!schedule) {
      return response.status(404).send({ error: { message: 'Not found' } })
    }

    await schedule.delete()

    return response.status(204).send(null)
  }
}
