import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import AuditLog from '#models/audit_log'
import Notification from '#models/notification'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function registerTeacher(
  client: any,
  overrides: Record<string, unknown> = {}
): Promise<{ token: string; user: { id: string; first_name: string } }> {
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

async function registerStudent(
  client: any,
  overrides: Record<string, unknown> = {}
): Promise<{ token: string; user: { id: string; first_name: string } }> {
  const response = await client.post('/api/v1/auth/register').json({
    email: 'student@example.com',
    password: 'password123',
    first_name: 'Bob',
    profile_type: 'student',
    birth_date: '2000-01-01',
    ...overrides,
  })
  return response.body()
}

async function createClass(client: any, token: string, overrides: Record<string, unknown> = {}) {
  const response = await client
    .post('/api/v1/classes')
    .header('Authorization', `Bearer ${token}`)
    .json({
      name: 'Brazilian Jiu-Jitsu',
      martial_art: 'BJJ',
      has_belt_system: true,
      schedules: [{ day_of_week: 1, start_time: '09:00', end_time: '10:00' }],
      ...overrides,
    })
  return response.body()
}

async function createInvitationAndJoin(
  client: any,
  teacherToken: string,
  studentToken: string,
  classId: string
) {
  const inv = await client
    .post(`/api/v1/classes/${classId}/invitations`)
    .header('Authorization', `Bearer ${teacherToken}`)
    .json({
      expires_at: DateTime.now().plus({ days: 7 }).toISO(),
      max_uses: null,
    })

  let invToken = inv.body().token

  // If a 409 is returned, an active invitation already exists — reuse it
  if (!invToken) {
    const listResp = await client
      .get(`/api/v1/classes/${classId}/invitations`)
      .header('Authorization', `Bearer ${teacherToken}`)
    invToken = listResp.body()[0].token
  }

  const joinResp = await client
    .post(`/api/v1/join/${invToken}`)
    .header('Authorization', `Bearer ${studentToken}`)
    .json({ consent: true })

  return joinResp.body()
}

async function createAnnouncement(
  client: any,
  token: string,
  classId: string,
  overrides: Record<string, unknown> = {}
) {
  return client
    .post(`/api/v1/classes/${classId}/announcements`)
    .header('Authorization', `Bearer ${token}`)
    .json({
      title: 'Class cancelled this week',
      content: 'Due to the tournament, there will be no classes this week. See you next Monday!',
      ...overrides,
    })
}

// ---------------------------------------------------------------------------
// Create announcement
// ---------------------------------------------------------------------------

test.group('Announcements — Create', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('happy path: owner teacher creates announcement → 201', async ({ client, assert }) => {
    const teacher = await registerTeacher(client)
    const cls = await createClass(client, teacher.token)

    const response = await createAnnouncement(client, teacher.token, cls.id)

    response.assertStatus(201)
    const body = response.body()
    assert.exists(body.id)
    assert.equal(body.title, 'Class cancelled this week')
    assert.exists(body.content)
    assert.equal(body.author.first_name, 'Alice')
    assert.exists(body.created_at)

    // Verify DB row
    const row = await db.from('announcements').where('id', body.id).first()
    assert.exists(row)
  })

  test('non-owner teacher → 403', async ({ client }) => {
    const teacherA = await registerTeacher(client)
    const teacherB = await registerTeacher(client, { email: 'teacher2@example.com' })
    const cls = await createClass(client, teacherA.token)

    const response = await createAnnouncement(client, teacherB.token, cls.id)
    response.assertStatus(403)
  })

  test('student → 403', async ({ client }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)

    const response = await createAnnouncement(client, student.token, cls.id)
    response.assertStatus(403)
  })

  test('non-existent class → 404', async ({ client }) => {
    const teacher = await registerTeacher(client)
    const response = await createAnnouncement(
      client,
      teacher.token,
      '00000000-0000-0000-0000-000000000000'
    )
    response.assertStatus(404)
  })

  test('audit log written on announcement creation', async ({ client, assert }) => {
    const teacher = await registerTeacher(client)
    const cls = await createClass(client, teacher.token)

    const response = await createAnnouncement(client, teacher.token, cls.id)
    const announcementId = response.body().id

    const log = await AuditLog.query()
      .where('user_id', teacher.user.id)
      .where('action', 'announcement_created')
      .where('resource_id', announcementId)
      .first()
    assert.exists(log)
  })
})

// ---------------------------------------------------------------------------
// List announcements (per class)
// ---------------------------------------------------------------------------

test.group('Announcements — List (class)', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('enrolled student sees announcements', async ({ client, assert }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)

    await createInvitationAndJoin(client, teacher.token, student.token, cls.id)
    await createAnnouncement(client, teacher.token, cls.id)

    const response = await client
      .get(`/api/v1/classes/${cls.id}/announcements`)
      .header('Authorization', `Bearer ${student.token}`)

    response.assertStatus(200)
    const body = response.body()
    assert.lengthOf(body, 1)
    assert.equal(body[0].title, 'Class cancelled this week')
    assert.equal(body[0].author.first_name, 'Alice')
  })

  test('non-enrolled user → 403', async ({ client }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)

    const response = await client
      .get(`/api/v1/classes/${cls.id}/announcements`)
      .header('Authorization', `Bearer ${student.token}`)

    response.assertStatus(403)
  })

  test('owner teacher sees announcements', async ({ client, assert }) => {
    const teacher = await registerTeacher(client)
    const cls = await createClass(client, teacher.token)

    await createAnnouncement(client, teacher.token, cls.id)

    const response = await client
      .get(`/api/v1/classes/${cls.id}/announcements`)
      .header('Authorization', `Bearer ${teacher.token}`)

    response.assertStatus(200)
    assert.lengthOf(response.body(), 1)
  })
})

// ---------------------------------------------------------------------------
// My announcements (student aggregate)
// ---------------------------------------------------------------------------

test.group('Announcements — My announcements', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('student enrolled in 2 classes with 1 announcement each → returns 2', async ({
    client,
    assert,
  }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)

    const cls1 = await createClass(client, teacher.token, { name: 'BJJ Fundamentals' })
    const cls2 = await createClass(client, teacher.token, { name: 'Muay Thai Basics' })

    await createInvitationAndJoin(client, teacher.token, student.token, cls1.id)
    await createInvitationAndJoin(client, teacher.token, student.token, cls2.id)

    await createAnnouncement(client, teacher.token, cls1.id, {
      title: 'BJJ announcement title',
      content: 'BJJ announcement content is long enough',
    })
    await createAnnouncement(client, teacher.token, cls2.id, {
      title: 'Muay Thai announcement',
      content: 'Muay Thai announcement content is long enough',
    })

    const response = await client
      .get('/api/v1/announcements')
      .header('Authorization', `Bearer ${student.token}`)

    response.assertStatus(200)
    assert.lengthOf(response.body().data, 2)
    // Should include class_name
    assert.exists(response.body().data[0].class_name)
  })

  test('teacher → 403', async ({ client }) => {
    const teacher = await registerTeacher(client)

    const response = await client
      .get('/api/v1/announcements')
      .header('Authorization', `Bearer ${teacher.token}`)

    response.assertStatus(403)
  })
})

// ---------------------------------------------------------------------------
// Delete announcement
// ---------------------------------------------------------------------------

test.group('Announcements — Delete', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('owner teacher deletes announcement → 204', async ({ client, assert }) => {
    const teacher = await registerTeacher(client)
    const cls = await createClass(client, teacher.token)

    const created = await createAnnouncement(client, teacher.token, cls.id)
    const announcementId = created.body().id

    const response = await client
      .delete(`/api/v1/classes/${cls.id}/announcements/${announcementId}`)
      .header('Authorization', `Bearer ${teacher.token}`)

    response.assertStatus(204)

    const row = await db.from('announcements').where('id', announcementId).first()
    assert.isNull(row)
  })

  test('non-owner teacher → 403', async ({ client }) => {
    const teacherA = await registerTeacher(client)
    const teacherB = await registerTeacher(client, { email: 'teacher2@example.com' })
    const cls = await createClass(client, teacherA.token)

    const created = await createAnnouncement(client, teacherA.token, cls.id)
    const announcementId = created.body().id

    const response = await client
      .delete(`/api/v1/classes/${cls.id}/announcements/${announcementId}`)
      .header('Authorization', `Bearer ${teacherB.token}`)

    response.assertStatus(403)
  })
})

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

test.group('Announcements — Notifications', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('AnnouncementCreated creates notifications for all enrolled students', async ({
    client,
    assert,
  }) => {
    const teacher = await registerTeacher(client)
    const studentA = await registerStudent(client, { email: 'studentA@example.com' })
    const studentB = await registerStudent(client, { email: 'studentB@example.com' })

    const cls = await createClass(client, teacher.token)

    await createInvitationAndJoin(client, teacher.token, studentA.token, cls.id)
    await createInvitationAndJoin(client, teacher.token, studentB.token, cls.id)

    await createAnnouncement(client, teacher.token, cls.id)

    // Allow event listeners to complete
    await new Promise((r) => setTimeout(r, 100))

    const notifA = await Notification.query()
      .where('user_id', studentA.user.id)
      .where('type', 'announcement_created')
      .first()
    assert.exists(notifA)

    const notifB = await Notification.query()
      .where('user_id', studentB.user.id)
      .where('type', 'announcement_created')
      .first()
    assert.exists(notifB)
  })
})
