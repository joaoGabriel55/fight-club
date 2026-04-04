import Enrollment from '#models/enrollment'
import logger from '@adonisjs/core/services/logger'

/**
 * PaymentReminderJob
 *
 * Stub: iterates active enrollments and logs a reminder for each.
 * In the future this will send emails via @adonisjs/mail.
 * Intended to run monthly on the 1st at 09:00.
 */
export default class PaymentReminderJob {
  async run(): Promise<number> {
    const enrollments = await Enrollment.query()
      .where('status', 'active')
      .preload('student')
      .preload('class')

    let count = 0
    for (const enrollment of enrollments) {
      logger.info(
        `PaymentReminderJob: would send reminder to student ${enrollment.studentId} for class "${enrollment.class.name}"`
      )
      count++
    }

    logger.info(`PaymentReminderJob: processed ${count} active enrollments`)
    return count
  }
}
