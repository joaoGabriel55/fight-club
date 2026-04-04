import User from '#models/user'
import Notification from '#models/notification'

export default class NotificationPolicy {
  static view(user: User, notification: Notification): boolean {
    return notification.userId === user.id
  }

  static markRead(user: User, notification: Notification): boolean {
    return notification.userId === user.id
  }
}
