import { Queue, Worker } from 'bullmq'
import env from '#start/env'
import logger from '@adonisjs/core/services/logger'
import CleanupExpiredInvitationsJob from '#jobs/cleanup_expired_invitations_job'
import PurgeExpiredNotificationsJob from '#jobs/purge_expired_notifications_job'
import PurgeExpiredTokensJob from '#jobs/purge_expired_tokens_job'
import PaymentReminderJob from '#jobs/payment_reminder_job'
import NotifyClassStartReminderJob from '#jobs/notify_class_start_reminder_job'
import NotifySessionReviewJob from '#jobs/notify_session_review_job'

const connection = {
  host: env.get('REDIS_HOST'),
  port: env.get('REDIS_PORT'),
  password: env.get('REDIS_PASSWORD', ''),
}

const QUEUE_NAME = 'scheduled-jobs'

const queue = new Queue(QUEUE_NAME, { connection })

const jobMap: Record<string, () => Promise<number>> = {
  'cleanup-expired-invitations': () => new CleanupExpiredInvitationsJob().run(),
  'purge-expired-notifications': () => new PurgeExpiredNotificationsJob().run(),
  'purge-expired-tokens': () => new PurgeExpiredTokensJob().run(),
  'payment-reminder': () => new PaymentReminderJob().run(),
  'notify-class-start-reminder': () => new NotifyClassStartReminderJob().run(),
  'notify-session-review': () => new NotifySessionReviewJob().run(),
}

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const handler = jobMap[job.name]
    if (!handler) {
      logger.warn(`Unknown job: ${job.name}`)
      return
    }

    logger.info(`Running job: ${job.name}`)
    const count = await handler()
    logger.info(`Job ${job.name} completed — processed ${count} items`)
    return count
  },
  { connection }
)

worker.on('failed', (job, err) => {
  logger.error(`Job ${job?.name} failed: ${err.message}`)
})

async function registerRepeatableJobs() {
  await queue.upsertJobScheduler('cleanup-expired-invitations', { pattern: '0 2 * * *' })
  await queue.upsertJobScheduler('purge-expired-notifications', { pattern: '30 2 * * *' })
  await queue.upsertJobScheduler('purge-expired-tokens', { pattern: '0 3 * * *' })
  await queue.upsertJobScheduler('payment-reminder', { pattern: '0 9 1 * *' })
  await queue.upsertJobScheduler('notify-class-start-reminder', { pattern: '0 * * * *' })
  await queue.upsertJobScheduler('notify-session-review', { pattern: '0 18 * * *' })

  logger.info('BullMQ scheduled jobs registered with Valkey')
}

registerRepeatableJobs().catch((err) => {
  logger.error(`Failed to register scheduled jobs: ${err.message}`)
})

export { queue, worker }
