import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import Enrollment from '#models/enrollment'
import SessionNotification from '#models/session_notification'
import { NotificationService } from '#services/notification_service'
import logger from '@adonisjs/core/services/logger'

export default class NotifyClassStartReminderJob {
  async run(referenceDate?: DateTime): Promise<number> {
    const now = referenceDate ?? DateTime.now()
    const today = now.toFormat('yyyy-MM-dd')
    const currentDayOfWeek = now.weekday === 7 ? 0 : now.weekday

    const enrollments = await Enrollment.query()
      .where('status', 'active')
      .preload('student')
      .preload('class', (query) => {
        query.whereNull('deleted_at').preload('schedules')
      })

    let notificationCount = 0

    for (const enrollment of enrollments) {
      const schedules = enrollment.class.schedules

      const todaySchedule = schedules.find((s) => s.dayOfWeek === currentDayOfWeek)

      if (!todaySchedule) {
        continue
      }

      const [hours, minutes] = todaySchedule.startTime.split(':').map(Number)
      const sessionStart = DateTime.fromObject({
        year: now.year,
        month: now.month,
        day: now.day,
        hour: hours,
        minute: minutes,
      })

      const oneHourBefore = sessionStart.minus({ hours: 1 })

      const isWithinWindow = now >= oneHourBefore && now < sessionStart

      if (!isWithinWindow) {
        continue
      }

      const existingNotification = await SessionNotification.query()
        .where('enrollment_id', enrollment.id)
        .where('session_date', today)
        .where('notification_type', 'class_starting_soon')
        .first()

      if (existingNotification) {
        continue
      }

      try {
        await db.transaction(async (trx) => {
          await SessionNotification.create(
            {
              enrollmentId: enrollment.id,
              sessionDate: DateTime.fromFormat(today, 'yyyy-MM-dd'),
              notificationType: 'class_starting_soon',
              sentAt: now,
            },
            { client: trx }
          )

          await NotificationService.createNotification(
            enrollment.studentId,
            'class_starting_soon',
            'Class starting soon',
            `${enrollment.class.name} starts in 1 hour`,
            {
              classId: enrollment.classId,
              sessionDate: today,
              enrollmentId: enrollment.id,
            }
          )
        })
        notificationCount++
      } catch (error) {
        logger.error(
          `NotifyClassStartReminderJob: failed to send notification for enrollment ${enrollment.id}: ${error.message}`
        )
      }
    }

    logger.info(`NotifyClassStartReminderJob: sent ${notificationCount} notifications`)
    return notificationCount
  }
}
