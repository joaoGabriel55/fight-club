import { DateTime } from 'luxon'
import Invitation from '#models/invitation'

/**
 * CleanupExpiredInvitationsJob
 *
 * Marks expired invitations as inactive.
 * Defined here but not yet scheduled — wired to the scheduler in v0.8.
 * Can be run manually in tests or via ace if needed.
 */
export default class CleanupExpiredInvitationsJob {
  async run(): Promise<number> {
    const result = await Invitation.query()
      .where('is_active', true)
      .where('expires_at', '<=', DateTime.now().toSQL()!)
      .update({ is_active: false })

    return result as unknown as number
  }
}
