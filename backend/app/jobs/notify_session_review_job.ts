import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import Enrollment from '#models/enrollment'
import Review from '#models/review'
import SessionNotification from '#models/session_notification'
import { NotificationService } from '#services/notification_service'
import logger from '@adonisjs/core/services/logger'

export default class NotifySessionReviewJob {
  async run(referenceDate?: DateTime): Promise<number> {
    const reference = referenceDate ?? DateTime.now()
    const yesterday = reference.minus({ days: 1 })
    const yesterdayStr = yesterday.toFormat('yyyy-MM-dd')
    const yesterdayDayOfWeek = yesterday.weekday === 7 ? 0 : yesterday.weekday

    const enrollments = await Enrollment.query()
      .where('status', 'active')
      .preload('student')
      .preload('class', (query) => {
        query.whereNull('deleted_at').preload('schedules')
      })

    let notificationCount = 0

    for (const enrollment of enrollments) {
      const schedules = enrollment.class.schedules

      const yesterdaySchedule = schedules.find((s) => s.dayOfWeek === yesterdayDayOfWeek)

      if (!yesterdaySchedule) {
        continue
      }

      const existingReview = await Review.query()
        .where('class_id', enrollment.classId)
        .where('student_id', enrollment.studentId)
        .where('session_date', yesterdayStr)
        .first()

      if (existingReview) {
        continue
      }

      const existingNotification = await SessionNotification.query()
        .where('enrollment_id', enrollment.id)
        .where('session_date', yesterdayStr)
        .where('notification_type', 'class_session_ended')
        .first()

      if (existingNotification) {
        continue
      }

      try {
        await db.transaction(async (trx) => {
          await SessionNotification.create(
            {
              enrollmentId: enrollment.id,
              sessionDate: yesterday,
              notificationType: 'class_session_ended',
              sentAt: DateTime.now(),
            },
            { client: trx }
          )

          await NotificationService.createNotification(
            enrollment.studentId,
            'class_session_ended',
            'Rate your class',
            `You can now review ${enrollment.class.name} for yesterday's session`,
            {
              classId: enrollment.classId,
              sessionDate: yesterdayStr,
              enrollmentId: enrollment.id,
            }
          )
        })
        notificationCount++
      } catch (error) {
        logger.error(
          `NotifySessionReviewJob: failed to send notification for enrollment ${enrollment.id}: ${error.message}`
        )
      }
    }

    logger.info(`NotifySessionReviewJob: sent ${notificationCount} notifications`)
    return notificationCount
  }
}
