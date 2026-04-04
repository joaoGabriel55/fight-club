import { DateTime } from 'luxon'
import Notification from '#models/notification'
import logger from '@adonisjs/core/services/logger'

/**
 * PurgeExpiredNotificationsJob
 *
 * Deletes notification rows where expires_at < now().
 * Intended to run daily at 02:30.
 */
export default class PurgeExpiredNotificationsJob {
  async run(): Promise<number> {
    const expired = await Notification.query()
      .whereNotNull('expires_at')
      .where('expires_at', '<', DateTime.now().toSQL()!)

    const count = expired.length
    for (const n of expired) {
      await n.delete()
    }

    logger.info(`PurgeExpiredNotificationsJob: deleted ${count} expired notifications`)
    return count
  }
}
