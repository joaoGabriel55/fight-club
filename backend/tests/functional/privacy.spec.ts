import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import AuditLog from '#models/audit_log'
import User from '#models/user'
import Enrollment from '#models/enrollment'
import Feedback from '#models/feedback'
import BeltProgress from '#models/belt_progress'

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
    last_name: 'Smith',
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

async function sendFeedback(
  client: any,
  token: string,
  enrollmentId: string,
  overrides: Record<string, unknown> = {}
) {
  return client
    .post(`/api/v1/enrollments/${enrollmentId}/feedback`)
    .header('Authorization', `Bearer ${token}`)
    .json({
      content: 'Great progress on your guard passing!',
      ...overrides,
    })
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
      belt_name: 'White',
      awarded_at: DateTime.now().minus({ days: 1 }).toISODate(),
      ...overrides,
    })
}

// ---------------------------------------------------------------------------
// Data Export
// ---------------------------------------------------------------------------

test.group('Privacy — Data Export', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('own data only: User A export does not contain User B data', async ({ client, assert }) => {
    const teacher = await registerTeacher(client)
    const studentA = await registerStudent(client, {
      email: 'studentA@example.com',
      first_name: 'Alice',
    })
    const studentB = await registerStudent(client, {
      email: 'studentB@example.com',
      first_name: 'Bob',
    })
    const cls = await createClass(client, teacher.token)

    const enrollmentA = await enrollStudent(client, teacher.token, studentA.token, cls.id)
    const enrollmentB = await enrollStudent(client, teacher.token, studentB.token, cls.id)

    await sendFeedback(client, teacher.token, enrollmentA.id, {
      content: 'Feedback for Alice only!',
    })
    await sendFeedback(client, teacher.token, enrollmentB.id, {
      content: 'Feedback for Bob only!',
    })

    const response = await client
      .get('/api/v1/privacy/my-data')
      .header('Authorization', `Bearer ${studentA.token}`)

    response.assertStatus(200)
    const body = response.body()

    // Should only contain Alice's data
    assert.equal(body.account.first_name, 'Alice')
    assert.lengthOf(body.feedback_received, 1)
    assert.include(body.feedback_received[0].content, 'Alice')
  })

  test('decrypted fields: exported email is plaintext', async ({ client, assert }) => {
    await registerStudent(client)
    const loginResp = await client.post('/api/v1/auth/login').json({
      email: 'student@example.com',
      password: 'password123',
    })
    const token = loginResp.body().token

    const response = await client
      .get('/api/v1/privacy/my-data')
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    assert.equal(response.body().account.email, 'student@example.com')
  })

  test('completeness: export includes enrollments, feedback, belt_progress', async ({
    client,
    assert,
  }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    const enrollment = await enrollStudent(client, teacher.token, student.token, cls.id)

    await sendFeedback(client, teacher.token, enrollment.id)
    await awardBelt(client, teacher.token, enrollment.id)

    const response = await client
      .get('/api/v1/privacy/my-data')
      .header('Authorization', `Bearer ${student.token}`)

    response.assertStatus(200)
    const body = response.body()
    assert.isArray(body.enrollments)
    assert.lengthOf(body.enrollments, 1)
    assert.isArray(body.feedback_received)
    assert.lengthOf(body.feedback_received, 1)
    assert.isArray(body.belt_progress)
    assert.lengthOf(body.belt_progress, 1)
    assert.isArray(body.announcements_received)
  })

  test('audit log: data_export_requested logged', async ({ client, assert }) => {
    const student = await registerStudent(client)

    await client.get('/api/v1/privacy/my-data').header('Authorization', `Bearer ${student.token}`)

    const log = await AuditLog.query()
      .where('user_id', student.user.id)
      .where('action', 'data_export_requested')
      .first()
    assert.exists(log)
  })
})

// ---------------------------------------------------------------------------
// Account Erasure
// ---------------------------------------------------------------------------

test.group('Privacy — Account Erasure', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('erasure → 204, user anonymized', async ({ client, assert }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    await enrollStudent(client, teacher.token, student.token, cls.id)

    const response = await client
      .delete('/api/v1/privacy/my-data')
      .header('Authorization', `Bearer ${student.token}`)

    response.assertStatus(204)

    // Check user row is anonymized
    const userRow = await User.query().where('id', student.user.id).first()
    assert.exists(userRow)
    assert.exists(userRow!.deletedAt)
    assert.equal(userRow!.firstName, 'Deleted')
    assert.notEqual(userRow!.email, 'student@example.com')
  })

  test('erasure cascades: enrollments, feedback, belt_progress deleted', async ({
    client,
    assert,
  }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    const enrollment = await enrollStudent(client, teacher.token, student.token, cls.id)

    await sendFeedback(client, teacher.token, enrollment.id)
    await awardBelt(client, teacher.token, enrollment.id)

    await client
      .delete('/api/v1/privacy/my-data')
      .header('Authorization', `Bearer ${student.token}`)

    const enrollments = await Enrollment.query().where('student_id', student.user.id)
    assert.lengthOf(enrollments, 0)

    const feedback = await Feedback.query().where('enrollment_id', enrollment.id)
    assert.lengthOf(feedback, 0)

    const belts = await BeltProgress.query().where('enrollment_id', enrollment.id)
    assert.lengthOf(belts, 0)
  })

  test('erasure: audit logs retained with anonymized user reference', async ({
    client,
    assert,
  }) => {
    const student = await registerStudent(client)

    // Create some audit entries
    const studentId = student.user.id

    await client
      .delete('/api/v1/privacy/my-data')
      .header('Authorization', `Bearer ${student.token}`)

    // Audit log for erasure should exist (was created before anonymization)
    const logs = await AuditLog.query().where('action', 'account_erasure_requested')
    assert.isAbove(logs.length, 0)

    // Logs that had user_id should now have null
    const userLogs = await AuditLog.query().where('user_id', studentId)
    assert.lengthOf(userLogs, 0)
  })

  test('audit log: account_erasure_requested logged', async ({ client, assert }) => {
    const student = await registerStudent(client)

    await client
      .delete('/api/v1/privacy/my-data')
      .header('Authorization', `Bearer ${student.token}`)

    const log = await AuditLog.query().where('action', 'account_erasure_requested').first()
    assert.exists(log)
  })
})

// ---------------------------------------------------------------------------
// Privacy Policy
// ---------------------------------------------------------------------------

test.group('Privacy — Policy', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('no auth required: GET /privacy/policy → 200', async ({ client, assert }) => {
    const response = await client.get('/api/v1/privacy/policy')

    response.assertStatus(200)
    assert.isString(response.body().content)
    assert.isAbove(response.body().content.length, 0)
  })
})
