import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import Invitation from '#models/invitation'
import Notification from '#models/notification'
import CleanupExpiredInvitationsJob from '#jobs/cleanup_expired_invitations_job'
import PurgeExpiredNotificationsJob from '#jobs/purge_expired_notifications_job'
import PaymentReminderJob from '#jobs/payment_reminder_job'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function registerTeacher(
  client: any,
  overrides: Record<string, unknown> = {}
): Promise<{ token: string; user: { id: string } }> {
  const response = await client.post('/api/v1/auth/register').json({
    email: 'teacher@example.com',
    password: 'password123',
    first_name: 'Alice',
    profile_type: 'teacher',
    birth_date: '1990-01-01',
    ...overrides,
  })
  return response.body()
}

async function createClass(client: any, token: string) {
  return client
    .post('/api/v1/classes')
    .header('Authorization', `Bearer ${token}`)
    .json({
      name: 'Brazilian Jiu-Jitsu',
      martial_art: 'BJJ',
      has_belt_system: true,
      schedules: [{ day_of_week: 1, start_time: '09:00', end_time: '10:00' }],
    })
}

// ---------------------------------------------------------------------------
// Security Headers
// ---------------------------------------------------------------------------

test.group('Security Headers', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('GET /health includes security headers', async ({ client, assert }) => {
    const response = await client.get('/health')

    response.assertStatus(200)
    assert.equal(response.header('x-content-type-options'), 'nosniff')
    assert.equal(response.header('x-frame-options'), 'DENY')
    assert.equal(response.header('x-xss-protection'), '1; mode=block')
    assert.equal(response.header('referrer-policy'), 'strict-origin-when-cross-origin')
    assert.include(response.header('permissions-policy'), 'camera=()')
  })

  test('X-Request-ID is present and unique per request', async ({ client, assert }) => {
    const r1 = await client.get('/health')
    const r2 = await client.get('/health')

    const id1 = r1.header('x-request-id')
    const id2 = r2.header('x-request-id')

    assert.isString(id1)
    assert.isString(id2)
    assert.notEqual(id1, id2)
  })
})

// ---------------------------------------------------------------------------
// Cleanup job — expired invitations
// ---------------------------------------------------------------------------

test.group('CleanupExpiredInvitationsJob', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('deletes only expired invitations', async ({ client, assert }) => {
    const { token } = await registerTeacher(client)
    const classRes = await createClass(client, token)
    const classId = classRes.body().id

    // Insert 3 expired invitations
    for (let i = 0; i < 3; i++) {
      await Invitation.create({
        classId,
        token: crypto.randomUUID(),
        expiresAt: DateTime.now().minus({ days: 1 }),
        isActive: true,
        maxUses: 10,
        useCount: 0,
      })
    }

    // Insert 2 active (not expired) invitations
    for (let i = 0; i < 2; i++) {
      await Invitation.create({
        classId,
        token: crypto.randomUUID(),
        expiresAt: DateTime.now().plus({ days: 7 }),
        isActive: true,
        maxUses: 10,
        useCount: 0,
      })
    }

    const beforeCount = await Invitation.query().where('class_id', classId)
    assert.equal(beforeCount.length, 5)

    const job = new CleanupExpiredInvitationsJob()
    const deleted = await job.run()

    assert.equal(deleted, 3)

    const remaining = await Invitation.query().where('class_id', classId)
    assert.equal(remaining.length, 2)
    for (const inv of remaining) {
      assert.isTrue(inv.expiresAt > DateTime.now())
    }
  })
})

// ---------------------------------------------------------------------------
// Cleanup job — expired notifications
// ---------------------------------------------------------------------------

test.group('PurgeExpiredNotificationsJob', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('deletes only expired notifications', async ({ client, assert }) => {
    const { user } = await registerTeacher(client)

    // Insert 5 expired notifications
    for (let i = 0; i < 5; i++) {
      await Notification.create({
        userId: user.id,
        type: 'test',
        title: `Expired ${i}`,
        body: 'body',
        data: {},
        expiresAt: DateTime.now().minus({ days: 1 }),
      })
    }

    // Insert 3 active notifications
    for (let i = 0; i < 3; i++) {
      await Notification.create({
        userId: user.id,
        type: 'test',
        title: `Active ${i}`,
        body: 'body',
        data: {},
        expiresAt: DateTime.now().plus({ days: 30 }),
      })
    }

    const beforeCount = await Notification.query().where('user_id', user.id)
    assert.equal(beforeCount.length, 8)

    const job = new PurgeExpiredNotificationsJob()
    const deleted = await job.run()

    assert.equal(deleted, 5)

    const remaining = await Notification.query().where('user_id', user.id)
    assert.equal(remaining.length, 3)
  })
})

// ---------------------------------------------------------------------------
// Payment Reminder Job — no error
// ---------------------------------------------------------------------------

test.group('PaymentReminderJob', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('runs without throwing', async ({ assert }) => {
    const job = new PaymentReminderJob()
    const count = await job.run()
    assert.isNumber(count)
  })
})

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

test.group('Pagination — GET /api/v1/classes', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('returns paginated data with meta', async ({ client, assert }) => {
    const { token } = await registerTeacher(client)

    // Create 5 classes
    for (let i = 0; i < 5; i++) {
      await createClass(client, token)
    }

    const response = await client
      .get('/api/v1/classes?page=1&per_page=2')
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    const body = response.body()

    assert.isArray(body.data)
    assert.equal(body.data.length, 2)
    assert.equal(body.meta.total, 5)
    assert.equal(body.meta.page, 1)
    assert.equal(body.meta.per_page, 2)
  })
})
