import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import Notification from '#models/notification'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function registerStudent(
  client: any,
  overrides: Record<string, unknown> = {}
): Promise<{ token: string; user: { id: string; first_name: string } }> {
  const response = await client.post('/api/v1/auth/register').json({
    email: 'student-notif@example.com',
    password: 'password123',
    first_name: 'Bob',
    profile_type: 'student',
    ...overrides,
  })
  return response.body()
}

async function createNotificationsForUser(userId: string, count: number) {
  for (let i = 0; i < count; i++) {
    await Notification.create({
      userId,
      type: 'test',
      title: `Test notification ${i + 1}`,
      body: null,
      data: {},
      expiresAt: DateTime.now().plus({ days: 90 }),
    })
  }
}

// ---------------------------------------------------------------------------
// List notifications
// ---------------------------------------------------------------------------

test.group('Notifications — List', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('returns notifications with unread count', async ({ client, assert }) => {
    const student = await registerStudent(client)
    await createNotificationsForUser(student.user.id, 3)

    const response = await client
      .get('/api/v1/notifications')
      .header('Authorization', `Bearer ${student.token}`)

    response.assertStatus(200)
    const body = response.body()
    assert.exists(body.data)
    assert.exists(body.meta)
    assert.equal(body.meta.unread_count, 3)
    assert.lengthOf(body.data, 3)
  })

  test('does not return expired notifications', async ({ client, assert }) => {
    const student = await registerStudent(client)

    // Create a non-expired notification
    await Notification.create({
      userId: student.user.id,
      type: 'test',
      title: 'Active',
      data: {},
      expiresAt: DateTime.now().plus({ days: 30 }),
    })

    // Create an expired notification
    await Notification.create({
      userId: student.user.id,
      type: 'test',
      title: 'Expired',
      data: {},
      expiresAt: DateTime.now().minus({ days: 1 }),
    })

    const response = await client
      .get('/api/v1/notifications')
      .header('Authorization', `Bearer ${student.token}`)

    response.assertStatus(200)
    const body = response.body()
    assert.lengthOf(body.data, 1)
    assert.equal(body.data[0].title, 'Active')
  })

  test('unread count reflects correct state', async ({ client, assert }) => {
    const student = await registerStudent(client)
    await createNotificationsForUser(student.user.id, 3)

    // Mark one as read
    const notifications = await Notification.query().where('user_id', student.user.id)
    notifications[0].readAt = DateTime.now()
    await notifications[0].save()

    const response = await client
      .get('/api/v1/notifications')
      .header('Authorization', `Bearer ${student.token}`)

    response.assertStatus(200)
    assert.equal(response.body().meta.unread_count, 2)
  })
})

// ---------------------------------------------------------------------------
// Mark read
// ---------------------------------------------------------------------------

test.group('Notifications — Mark Read', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('mark single notification as read', async ({ client, assert }) => {
    const student = await registerStudent(client)
    await createNotificationsForUser(student.user.id, 1)

    const notifications = await Notification.query().where('user_id', student.user.id)
    const notifId = notifications[0].id

    const response = await client
      .put(`/api/v1/notifications/${notifId}/read`)
      .header('Authorization', `Bearer ${student.token}`)

    response.assertStatus(200)
    assert.exists(response.body().read_at)

    // Verify in list
    const listResp = await client
      .get('/api/v1/notifications')
      .header('Authorization', `Bearer ${student.token}`)

    assert.isNotNull(listResp.body().data[0].read_at)
  })

  test('mark read — not owner → 403', async ({ client }) => {
    const studentA = await registerStudent(client)
    const studentB = await registerStudent(client, { email: 'studentB-notif@example.com' })

    await createNotificationsForUser(studentA.user.id, 1)
    const notifications = await Notification.query().where('user_id', studentA.user.id)

    const response = await client
      .put(`/api/v1/notifications/${notifications[0].id}/read`)
      .header('Authorization', `Bearer ${studentB.token}`)

    response.assertStatus(403)
  })
})

// ---------------------------------------------------------------------------
// Mark all read
// ---------------------------------------------------------------------------

test.group('Notifications — Mark All Read', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('marks all unread notifications as read', async ({ client, assert }) => {
    const student = await registerStudent(client)
    await createNotificationsForUser(student.user.id, 3)

    const response = await client
      .put('/api/v1/notifications/read-all')
      .header('Authorization', `Bearer ${student.token}`)

    response.assertStatus(200)
    assert.equal(response.body().updated, 3)

    // Verify all are read
    const listResp = await client
      .get('/api/v1/notifications')
      .header('Authorization', `Bearer ${student.token}`)
    assert.equal(listResp.body().meta.unread_count, 0)
  })

  test('only marks own notifications, not other users', async ({ client, assert }) => {
    const studentA = await registerStudent(client)
    const studentB = await registerStudent(client, { email: 'studentB-notif2@example.com' })

    await createNotificationsForUser(studentA.user.id, 2)
    await createNotificationsForUser(studentB.user.id, 2)

    const response = await client
      .put('/api/v1/notifications/read-all')
      .header('Authorization', `Bearer ${studentA.token}`)

    response.assertStatus(200)
    assert.equal(response.body().updated, 2)

    // Student B's notifications should still be unread
    const listResp = await client
      .get('/api/v1/notifications')
      .header('Authorization', `Bearer ${studentB.token}`)
    assert.equal(listResp.body().meta.unread_count, 2)
  })
})
