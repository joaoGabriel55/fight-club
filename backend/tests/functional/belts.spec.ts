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
    email: 'teacher-belt@example.com',
    password: 'password123',
    first_name: 'Sensei',
    profile_type: 'teacher',
    ...overrides,
  })
  return response.body()
}

async function registerStudent(
  client: any,
  overrides: Record<string, unknown> = {}
): Promise<{ token: string; user: { id: string; first_name: string } }> {
  const response = await client.post('/api/v1/auth/register').json({
    email: 'student-belt@example.com',
    password: 'password123',
    first_name: 'Karateka',
    profile_type: 'student',
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

async function enrollStudent(
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

async function awardBelt(
  client: any,
  token: string,
  enrollmentId: string,
  overrides: Record<string, unknown> = {}
) {
  return client
    .post(`/api/v1/enrollments/${enrollmentId}/belts`)
    .header('Authorization', `Bearer ${token}`)
    .json({
      belt_name: 'Blue',
      awarded_at: DateTime.now().minus({ days: 1 }).toISODate(),
      ...overrides,
    })
}

// ---------------------------------------------------------------------------
// Award belt
// ---------------------------------------------------------------------------

test.group('Belt Progress — Award', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('happy path: teacher awards belt → 201', async ({ client, assert }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    const enrollment = await enrollStudent(client, teacher.token, student.token, cls.id)

    const response = await awardBelt(client, teacher.token, enrollment.id)

    response.assertStatus(201)
    const body = response.body()
    assert.exists(body.id)
    assert.equal(body.belt_name, 'Blue')
    assert.exists(body.awarded_at)
    assert.equal(body.awarded_by.first_name, 'Sensei')
  })

  test('no belt system → 422', async ({ client }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token, { has_belt_system: false })
    const enrollment = await enrollStudent(client, teacher.token, student.token, cls.id)

    const response = await awardBelt(client, teacher.token, enrollment.id)

    response.assertStatus(422)
    response.assertBodyContains({ error: { message: 'This class does not use a belt system' } })
  })

  test('student tries to award belt → 403', async ({ client }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    const enrollment = await enrollStudent(client, teacher.token, student.token, cls.id)

    const response = await awardBelt(client, student.token, enrollment.id)
    response.assertStatus(403)
  })

  test('non-owner teacher → 403', async ({ client }) => {
    const teacherA = await registerTeacher(client)
    const teacherB = await registerTeacher(client, { email: 'teacher2-belt@example.com' })
    const student = await registerStudent(client)
    const cls = await createClass(client, teacherA.token)
    const enrollment = await enrollStudent(client, teacherA.token, student.token, cls.id)

    const response = await awardBelt(client, teacherB.token, enrollment.id)
    response.assertStatus(403)
  })

  test('audit log written on belt_awarded', async ({ client, assert }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    const enrollment = await enrollStudent(client, teacher.token, student.token, cls.id)

    const response = await awardBelt(client, teacher.token, enrollment.id)
    const beltId = response.body().id

    const log = await AuditLog.query()
      .where('user_id', teacher.user.id)
      .where('action', 'belt_awarded')
      .where('resource_id', beltId)
      .first()
    assert.exists(log)
  })
})

// ---------------------------------------------------------------------------
// Belt history
// ---------------------------------------------------------------------------

test.group('Belt Progress — History', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('returns belts in ascending awarded_at order', async ({ client, assert }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    const enrollment = await enrollStudent(client, teacher.token, student.token, cls.id)

    await awardBelt(client, teacher.token, enrollment.id, {
      belt_name: 'White',
      awarded_at: '2024-01-01',
    })
    await awardBelt(client, teacher.token, enrollment.id, {
      belt_name: 'Blue',
      awarded_at: '2024-06-01',
    })

    const response = await client
      .get(`/api/v1/enrollments/${enrollment.id}/belts`)
      .header('Authorization', `Bearer ${teacher.token}`)

    response.assertStatus(200)
    const belts = response.body()
    assert.lengthOf(belts, 2)
    assert.equal(belts[0].belt_name, 'White')
    assert.equal(belts[1].belt_name, 'Blue')
  })

  test('student can view own belt history', async ({ client, assert }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    const enrollment = await enrollStudent(client, teacher.token, student.token, cls.id)

    await awardBelt(client, teacher.token, enrollment.id)

    const response = await client
      .get(`/api/v1/enrollments/${enrollment.id}/belts`)
      .header('Authorization', `Bearer ${student.token}`)

    response.assertStatus(200)
    assert.lengthOf(response.body(), 1)
  })

  test('different student cannot view belt history → 403', async ({ client }) => {
    const teacher = await registerTeacher(client)
    const studentA = await registerStudent(client)
    const studentB = await registerStudent(client, { email: 'studentB-belt@example.com' })
    const cls = await createClass(client, teacher.token)

    const enrollmentA = await enrollStudent(client, teacher.token, studentA.token, cls.id)
    await enrollStudent(client, teacher.token, studentB.token, cls.id)

    await awardBelt(client, teacher.token, enrollmentA.id)

    const response = await client
      .get(`/api/v1/enrollments/${enrollmentA.id}/belts`)
      .header('Authorization', `Bearer ${studentB.token}`)

    response.assertStatus(403)
  })
})

// ---------------------------------------------------------------------------
// Belt awarded notification
// ---------------------------------------------------------------------------

test.group('Belt Progress — Notification', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('BeltAwarded creates notification for the student', async ({ client, assert }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    const enrollment = await enrollStudent(client, teacher.token, student.token, cls.id)

    await awardBelt(client, teacher.token, enrollment.id)

    // Allow event listeners to complete
    await new Promise((r) => setTimeout(r, 100))

    const notification = await Notification.query()
      .where('user_id', student.user.id)
      .where('type', 'belt_awarded')
      .first()

    assert.exists(notification)
    assert.equal(notification!.title, 'New belt awarded!')
    assert.exists(notification!.expiresAt)
  })
})
