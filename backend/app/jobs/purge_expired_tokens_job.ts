import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import logger from '@adonisjs/core/services/logger'

/**
 * PurgeExpiredTokensJob
 *
 * Deletes revoked/expired auth tokens from the auth_access_tokens table.
 * Intended to run daily at 03:00.
 */
export default class PurgeExpiredTokensJob {
  async run(): Promise<number> {
    const result = await db
      .from('auth_access_tokens')
      .where('expires_at', '<', DateTime.now().toSQL()!)
      .delete()

    const count = Array.isArray(result) ? (result[0] ?? 0) : result
    logger.info(`PurgeExpiredTokensJob: deleted ${count} expired tokens`)
    return Number(count)
  }
}
