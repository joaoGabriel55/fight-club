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
    ...overrides,
  })
  return response.body()
}

async function registerStudent(
  client: any,
  overrides: Record<string, unknown> = {}
): Promise<{ token: string; user: { id: string } }> {
  const response = await client.post('/api/v1/auth/register').json({
    email: 'student@example.com',
    password: 'password123',
    first_name: 'Bob',
    profile_type: 'student',
    ...overrides,
  })
  return response.body()
}

async function createClass(client: any, token: string) {
  const response = await client
    .post('/api/v1/classes')
    .header('Authorization', `Bearer ${token}`)
    .json({
      name: 'Brazilian Jiu-Jitsu',
      martial_art: 'BJJ',
      has_belt_system: true,
      schedules: [{ day_of_week: 1, start_time: '09:00', end_time: '10:00' }],
    })
  return response.body()
}

async function createInvitation(
  client: any,
  token: string,
  classId: string,
  overrides: Record<string, unknown> = {}
) {
  const response = await client
    .post(`/api/v1/classes/${classId}/invitations`)
    .header('Authorization', `Bearer ${token}`)
    .json({
      expires_at: DateTime.now().plus({ days: 7 }).toISO(),
      max_uses: null,
      ...overrides,
    })
  return response.body()
}

async function revokeInvitation(client: any, token: string, invitationId: string) {
  await client
    .delete(`/api/v1/invitations/${invitationId}`)
    .header('Authorization', `Bearer ${token}`)
}

async function joinClass(
  client: any,
  token: string,
  invToken: string,
  overrides: Record<string, unknown> = {}
) {
  return client
    .post(`/api/v1/join/${invToken}`)
    .header('Authorization', `Bearer ${token}`)
    .json({ consent: true, ...overrides })
}

// ---------------------------------------------------------------------------
// Join class
// ---------------------------------------------------------------------------

test.group('Enrollment — Join', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('happy path: valid token + consent → 201, enrollment in DB with data_consent_at', async ({
    client,
    assert,
  }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    const inv = await createInvitation(client, teacher.token, cls.id)

    const response = await joinClass(client, student.token, inv.token)

    response.assertStatus(201)
    const body = response.body()
    assert.equal(body.class_id, cls.id)
    assert.equal(body.status, 'active')
    assert.exists(body.data_consent_at)

    // enrollment row exists in DB
    const row = await db.from('enrollments').where('id', body.id).first()
    assert.exists(row)
    assert.exists(row.data_consent_at)
  })

  test('use_count is incremented after join', async ({ client, assert }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    const inv = await createInvitation(client, teacher.token, cls.id)

    await joinClass(client, student.token, inv.token)

    const row = await db.from('invitations').where('id', inv.id).first()
    assert.equal(row.use_count, 1)
  })

  test('no consent (missing) → 422', async ({ client }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    const inv = await createInvitation(client, teacher.token, cls.id)

    const response = await client
      .post(`/api/v1/join/${inv.token}`)
      .header('Authorization', `Bearer ${student.token}`)
      .json({})

    response.assertStatus(422)
  })

  test('consent: false → 422', async ({ client }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    const inv = await createInvitation(client, teacher.token, cls.id)

    const response = await joinClass(client, student.token, inv.token, { consent: false })
    response.assertStatus(422)
  })

  test('expired token → 410', async ({ client }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    const inv = await createInvitation(client, teacher.token, cls.id, {
      expires_at: DateTime.now().plus({ seconds: 1 }).toISO(),
    })

    // Force-expire by updating directly
    await db
      .from('invitations')
      .where('id', inv.id)
      .update({
        expires_at: DateTime.now().minus({ hours: 1 }).toSQL(),
      })

    const response = await joinClass(client, student.token, inv.token)
    response.assertStatus(410)
  })

  test('revoked token (is_active = false) → 410', async ({ client }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    const inv = await createInvitation(client, teacher.token, cls.id)

    await client
      .delete(`/api/v1/invitations/${inv.id}`)
      .header('Authorization', `Bearer ${teacher.token}`)

    const response = await joinClass(client, student.token, inv.token)
    response.assertStatus(410)
  })

  test('max uses exhausted → 410', async ({ client }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    const inv = await createInvitation(client, teacher.token, cls.id, { max_uses: 1 })

    // First join
    const student2 = await registerStudent(client, { email: 'student2@example.com' })
    await joinClass(client, student2.token, inv.token)

    // Second join should hit max uses
    const response = await joinClass(client, student.token, inv.token)
    response.assertStatus(410)
  })

  test('duplicate enrollment → 409', async ({ client }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    const inv = await createInvitation(client, teacher.token, cls.id)

    await joinClass(client, student.token, inv.token)

    // Revoke first invitation, then create a second to try again
    await revokeInvitation(client, teacher.token, inv.id)
    const inv2 = await createInvitation(client, teacher.token, cls.id)
    const response = await joinClass(client, student.token, inv2.token)
    response.assertStatus(409)
  })

  test('teacher trying to join → 403', async ({ client }) => {
    const teacher = await registerTeacher(client)
    const teacher2 = await registerTeacher(client, { email: 'teacher2@example.com' })
    const cls = await createClass(client, teacher.token)
    const inv = await createInvitation(client, teacher.token, cls.id)

    const response = await joinClass(client, teacher2.token, inv.token)
    response.assertStatus(403)
  })

  test('invalid token → 410', async ({ client }) => {
    const student = await registerStudent(client)

    const response = await joinClass(client, student.token, '00000000-0000-0000-0000-000000000000')
    response.assertStatus(410)
  })

  test('notification created for teacher after join', async ({ client, assert }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    const inv = await createInvitation(client, teacher.token, cls.id)

    await joinClass(client, student.token, inv.token)

    const notification = await Notification.query()
      .where('user_id', teacher.user.id)
      .where('type', 'student_enrolled')
      .first()
    assert.exists(notification)
  })

  test('audit log: student_enrolled written', async ({ client, assert }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    const inv = await createInvitation(client, teacher.token, cls.id)

    const response = await joinClass(client, student.token, inv.token)
    const enrollmentId = response.body().id

    const log = await AuditLog.query()
      .where('user_id', student.user.id)
      .where('action', 'student_enrolled')
      .where('resource_id', enrollmentId)
      .first()
    assert.exists(log)
  })
})

// ---------------------------------------------------------------------------
// List enrollments
// ---------------------------------------------------------------------------

test.group('Enrollment — List', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test("returns authenticated student's own enrollments only", async ({ client, assert }) => {
    const teacher = await registerTeacher(client)
    const studentA = await registerStudent(client)
    const studentB = await registerStudent(client, { email: 'student2@example.com' })

    const cls = await createClass(client, teacher.token)
    const inv = await createInvitation(client, teacher.token, cls.id)

    await joinClass(client, studentA.token, inv.token)

    // Revoke first invitation before creating a new one (only one active per class)
    await revokeInvitation(client, teacher.token, inv.id)
    const inv2 = await createInvitation(client, teacher.token, cls.id)
    await joinClass(client, studentB.token, inv2.token)

    const responseA = await client
      .get('/api/v1/enrollments')
      .header('Authorization', `Bearer ${studentA.token}`)

    responseA.assertStatus(200)
    assert.lengthOf(responseA.body(), 1)
    assert.equal(responseA.body()[0].class.name, 'Brazilian Jiu-Jitsu')
    assert.exists(responseA.body()[0].class.teacher_first_name)

    // Student B's enrollments do not appear in Student A's list
    const ids = responseA.body().map((e: any) => e.class_id)
    const responseB = await client
      .get('/api/v1/enrollments')
      .header('Authorization', `Bearer ${studentB.token}`)
    responseB.assertStatus(200)
    assert.lengthOf(responseB.body(), 1)
    // Each sees only their own entry
    assert.deepEqual(
      ids,
      responseA.body().map((e: any) => e.class_id)
    )
  })

  test('includes class schedules and teacher first name', async ({ client, assert }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    const inv = await createInvitation(client, teacher.token, cls.id)

    await joinClass(client, student.token, inv.token)

    const response = await client
      .get('/api/v1/enrollments')
      .header('Authorization', `Bearer ${student.token}`)

    response.assertStatus(200)
    const enrollment = response.body()[0]
    assert.equal(enrollment.class.teacher_first_name, 'Alice')
    assert.isArray(enrollment.class.schedules)
    assert.lengthOf(enrollment.class.schedules, 1)
  })
})

// ---------------------------------------------------------------------------
// Leave class
// ---------------------------------------------------------------------------

test.group('Enrollment — Leave', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('student can leave their class → 204, enrollment row deleted', async ({
    client,
    assert,
  }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    const inv = await createInvitation(client, teacher.token, cls.id)

    const joinResponse = await joinClass(client, student.token, inv.token)
    const enrollmentId = joinResponse.body().id

    const response = await client
      .delete(`/api/v1/enrollments/${enrollmentId}`)
      .header('Authorization', `Bearer ${student.token}`)

    response.assertStatus(204)

    const row = await db.from('enrollments').where('id', enrollmentId).first()
    assert.isNull(row)
  })

  test("student cannot delete another student's enrollment → 403", async ({ client }) => {
    const teacher = await registerTeacher(client)
    const studentA = await registerStudent(client)
    const studentB = await registerStudent(client, { email: 'student2@example.com' })

    const cls = await createClass(client, teacher.token)
    const invA = await createInvitation(client, teacher.token, cls.id)
    const joinA = await joinClass(client, studentA.token, invA.token)

    // Revoke first invitation before creating a new one (only one active per class)
    await revokeInvitation(client, teacher.token, invA.id)
    const invB = await createInvitation(client, teacher.token, cls.id)
    await joinClass(client, studentB.token, invB.token)

    const enrollmentAId = joinA.body().id

    const response = await client
      .delete(`/api/v1/enrollments/${enrollmentAId}`)
      .header('Authorization', `Bearer ${studentB.token}`)

    response.assertStatus(403)
  })

  test('audit log: student_left written', async ({ client, assert }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    const inv = await createInvitation(client, teacher.token, cls.id)

    const joinResponse = await joinClass(client, student.token, inv.token)
    const enrollmentId = joinResponse.body().id

    await client
      .delete(`/api/v1/enrollments/${enrollmentId}`)
      .header('Authorization', `Bearer ${student.token}`)

    const log = await AuditLog.query()
      .where('user_id', student.user.id)
      .where('action', 'student_left')
      .where('resource_id', enrollmentId)
      .first()
    assert.exists(log)
  })

  test('non-existent enrollment → 404', async ({ client }) => {
    const student = await registerStudent(client)

    const response = await client
      .delete('/api/v1/enrollments/00000000-0000-0000-0000-000000000000')
      .header('Authorization', `Bearer ${student.token}`)

    response.assertStatus(404)
  })
})
