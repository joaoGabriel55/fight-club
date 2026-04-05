import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import { NotificationService } from '#services/notification_service'
import { UserFactory } from '#database/factories/index'
import Notification from '#models/notification'

test.group('NotificationService', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('creates notification with correct userId, type, title, and body', async ({ assert }) => {
    const user = await UserFactory.create()

    const notification = await NotificationService.createNotification(
      user.id,
      'student_enrolled',
      'New Student',
      'A student has joined your class',
      { classId: 'abc-123' }
    )

    assert.exists(notification.id)
    assert.equal(notification.userId, user.id)
    assert.equal(notification.type, 'student_enrolled')
    assert.equal(notification.title, 'New Student')
    assert.equal(notification.body, 'A student has joined your class')
  })

  test('sets expiresAt approximately 90 days from now by default', async ({ assert }) => {
    const user = await UserFactory.create()
    const before = DateTime.now().plus({ days: 90 })

    const notification = await NotificationService.createNotification(
      user.id,
      'announcement',
      'Title',
      null,
      {}
    )

    const after = DateTime.now().plus({ days: 90 })

    assert.isNotNull(notification.expiresAt)
    // expiresAt should be between before and after (within a few seconds)
    assert.isTrue(
      notification.expiresAt!.toMillis() >= before.toMillis() - 5000,
      'expiresAt should be at least ~90 days from now'
    )
    assert.isTrue(
      notification.expiresAt!.toMillis() <= after.toMillis() + 5000,
      'expiresAt should not be more than ~90 days from now'
    )
  })

  test('custom TTL works (e.g., 30 days)', async ({ assert }) => {
    const user = await UserFactory.create()
    const before = DateTime.now().plus({ days: 30 })

    const notification = await NotificationService.createNotification(
      user.id,
      'feedback_received',
      'Feedback',
      'You received feedback',
      {},
      30
    )

    const after = DateTime.now().plus({ days: 30 })

    assert.isNotNull(notification.expiresAt)
    assert.isTrue(
      notification.expiresAt!.toMillis() >= before.toMillis() - 5000,
      'expiresAt should be at least ~30 days from now'
    )
    assert.isTrue(
      notification.expiresAt!.toMillis() <= after.toMillis() + 5000,
      'expiresAt should not be more than ~30 days from now'
    )
  })

  test('stores data field correctly as JSON', async ({ assert }) => {
    const user = await UserFactory.create()
    const data = {
      classId: 'cls-1',
      className: 'BJJ Fundamentals',
      nested: { key: 'value' },
    }

    const notification = await NotificationService.createNotification(
      user.id,
      'student_enrolled',
      'Enrolled',
      null,
      data
    )

    // Reload from database to verify persistence
    const fromDb = await Notification.findOrFail(notification.id)
    assert.deepEqual(fromDb.data, data)
  })

  test('creates notification with null body', async ({ assert }) => {
    const user = await UserFactory.create()

    const notification = await NotificationService.createNotification(
      user.id,
      'belt_awarded',
      'New Belt',
      null,
      { beltName: 'Blue' }
    )

    assert.isNull(notification.body)
    assert.equal(notification.title, 'New Belt')
  })

  test('notification is persisted in the database', async ({ assert }) => {
    const user = await UserFactory.create()

    await NotificationService.createNotification(user.id, 'student_enrolled', 'Test', 'Body', {})

    const count = await Notification.query().where('user_id', user.id).count('* as total')
    assert.equal(Number(count[0].$extras.total), 1)
  })
})
