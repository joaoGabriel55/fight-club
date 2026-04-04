import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Notification from '#models/notification'
import NotificationPolicy from '#policies/notification_policy'

export default class NotificationsController {
  /**
   * GET /api/v1/notifications
   * List authenticated user's notifications, excluding expired ones.
   */
  async index({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const notifications = await Notification.query()
      .where('user_id', user.id)
      .where((q) => {
        q.whereNull('expires_at').orWhere('expires_at', '>', DateTime.now().toSQL()!)
      })
      .orderBy('created_at', 'desc')

    const unreadCount = notifications.filter((n) => !n.readAt).length

    return response.status(200).send({
      data: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        data: n.data,
        read_at: n.readAt,
        created_at: n.createdAt,
      })),
      meta: {
        unread_count: unreadCount,
      },
    })
  }

  /**
   * PUT /api/v1/notifications/:id/read
   * Mark a single notification as read.
   */
  async markRead({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const notification = await Notification.find(params.id)
    if (!notification) {
      return response.status(404).send({ error: { message: 'Not found' } })
    }

    if (!NotificationPolicy.markRead(user, notification)) {
      return response.status(403).send({ error: { message: 'Forbidden' } })
    }

    notification.readAt = DateTime.now()
    await notification.save()

    return response.status(200).send({
      id: notification.id,
      read_at: notification.readAt,
    })
  }

  /**
   * PUT /api/v1/notifications/read-all
   * Mark all of the authenticated user's unread notifications as read.
   */
  async markAllRead({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const updated = await Notification.query()
      .where('user_id', user.id)
      .whereNull('read_at')
      .update({ read_at: DateTime.now().toSQL() })

    return response.status(200).send({ updated: updated[0] ?? 0 })
  }
}
