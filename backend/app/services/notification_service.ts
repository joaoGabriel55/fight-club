import Notification from '#models/notification'
import { DateTime } from 'luxon'

export class NotificationService {
  static async createNotification(
    userId: string,
    type: string,
    title: string,
    body: string | null,
    data: Record<string, unknown>,
    ttlDays: number = 90
  ): Promise<Notification> {
    return Notification.create({
      userId,
      type,
      title,
      body,
      data,
      expiresAt: DateTime.now().plus({ days: ttlDays }),
    })
  }
}
