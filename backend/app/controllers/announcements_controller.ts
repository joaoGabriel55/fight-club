import type { HttpContext } from '@adonisjs/core/http'
import emitter from '@adonisjs/core/services/emitter'
import Class from '#models/class'
import Announcement from '#models/announcement'
import Enrollment from '#models/enrollment'
import AnnouncementPolicy from '#policies/announcement_policy'
import AnnouncementCreated from '#events/announcement_created'
import { AuditLogService } from '#services/audit_log_service'
import { createAnnouncementValidator } from '#validators/announcement_validator'

export default class AnnouncementsController {
  /**
   * POST /api/v1/classes/:classId/announcements
   * Create an announcement (teacher must own class).
   */
  async store({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const cls = await Class.query().where('id', params.classId).whereNull('deleted_at').first()

    if (!cls) {
      return response.status(404).send({ error: { message: 'Not found' } })
    }

    if (!AnnouncementPolicy.create(user, cls)) {
      return response.status(403).send({ error: { message: 'Forbidden' } })
    }

    const data = await request.validateUsing(createAnnouncementValidator)

    const announcement = await Announcement.create({
      classId: cls.id,
      authorId: user.id,
      title: data.title,
      content: data.content,
    })

    await AuditLogService.log(user.id, 'announcement_created', 'announcement', {
      resourceId: announcement.id,
      ipAddress: request.ip(),
      metadata: { class_id: cls.id },
    })

    await emitter.emit(AnnouncementCreated, new AnnouncementCreated(announcement, cls.id, cls.name))

    return response.status(201).send({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      author: { first_name: user.firstName },
      created_at: announcement.createdAt,
    })
  }

  /**
   * GET /api/v1/classes/:classId/announcements
   * List announcements for a class (teacher or enrolled student).
   */
  async index({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const cls = await Class.query().where('id', params.classId).whereNull('deleted_at').first()

    if (!cls) {
      return response.status(404).send({ error: { message: 'Not found' } })
    }

    if (!(await AnnouncementPolicy.view(user, cls))) {
      return response.status(403).send({ error: { message: 'Forbidden' } })
    }

    const announcements = await Announcement.query()
      .where('class_id', cls.id)
      .preload('author')
      .orderBy('created_at', 'desc')

    return response.status(200).send(
      announcements.map((a) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        author: { first_name: a.author.firstName },
        created_at: a.createdAt,
      }))
    )
  }

  /**
   * GET /api/v1/announcements
   * Student view: all announcements across all enrolled classes.
   * Teacher calling this → 403.
   */
  async myAnnouncements({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    if (user.profileType === 'teacher') {
      return response.status(403).send({ error: { message: 'Forbidden' } })
    }

    const enrollments = await Enrollment.query()
      .where('student_id', user.id)
      .where('status', 'active')

    const classIds = enrollments.map((e) => e.classId)

    if (classIds.length === 0) {
      return response.status(200).send({ data: [], meta: { total: 0, page: 1, per_page: 20 } })
    }

    const page = Number(request.input('page', 1))
    const perPage = Number(request.input('per_page', 20))

    const paginated = await Announcement.query()
      .whereIn('class_id', classIds)
      .preload('author')
      .preload('class')
      .orderBy('created_at', 'desc')
      .paginate(page, perPage)

    return response.status(200).send({
      data: paginated.all().map((a) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        author: { first_name: a.author.firstName },
        class_name: a.class.name,
        class_id: a.classId,
        created_at: a.createdAt,
      })),
      meta: {
        total: paginated.total,
        page: paginated.currentPage,
        per_page: paginated.perPage,
      },
    })
  }

  /**
   * DELETE /api/v1/classes/:classId/announcements/:id
   * Delete an announcement (teacher must own class).
   */
  async destroy({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const cls = await Class.query().where('id', params.classId).whereNull('deleted_at').first()

    if (!cls) {
      return response.status(404).send({ error: { message: 'Not found' } })
    }

    if (!AnnouncementPolicy.delete(user, cls)) {
      return response.status(403).send({ error: { message: 'Forbidden' } })
    }

    const announcement = await Announcement.query()
      .where('id', params.id)
      .where('class_id', cls.id)
      .first()

    if (!announcement) {
      return response.status(404).send({ error: { message: 'Not found' } })
    }

    await announcement.delete()

    await AuditLogService.log(user.id, 'announcement_deleted', 'announcement', {
      resourceId: announcement.id,
      ipAddress: request.ip(),
      metadata: { class_id: cls.id },
    })

    return response.status(204).send(null)
  }
}
