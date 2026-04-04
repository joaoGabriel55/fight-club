import { DateTime } from 'luxon'
import Invitation from '#models/invitation'
import logger from '@adonisjs/core/services/logger'

/**
 * CleanupExpiredInvitationsJob
 *
 * Deletes invitation rows where expires_at < now().
 * Intended to run daily at 02:00.
 */
export default class CleanupExpiredInvitationsJob {
  async run(): Promise<number> {
    const expired = await Invitation.query().where('expires_at', '<', DateTime.now().toSQL()!)

    const count = expired.length
    for (const inv of expired) {
      await inv.delete()
    }

    logger.info(`CleanupExpiredInvitationsJob: deleted ${count} expired invitations`)
    return count
  }
}
