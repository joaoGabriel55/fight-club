import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import AuditLog from '#models/audit_log'

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

async function createInvitation(
  client: any,
  token: string,
  classId: string,
  overrides: Record<string, unknown> = {}
) {
  return client
    .post(`/api/v1/classes/${classId}/invitations`)
    .header('Authorization', `Bearer ${token}`)
    .json({
      expires_at: DateTime.now().plus({ days: 7 }).toISO(),
      max_uses: null,
      ...overrides,
    })
}

// ---------------------------------------------------------------------------
// Generate invitation
// ---------------------------------------------------------------------------

test.group('Invitations — Generate', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('happy path: teacher creates invitation → 201 with token and invite_url', async ({
    client,
    assert,
  }) => {
    const { token } = await registerTeacher(client)
    const cls = await createClass(client, token)
    const classId = cls.body().id

    const response = await createInvitation(client, token, classId)

    response.assertStatus(201)
    const body = response.body()
    assert.isString(body.token)
    // token should be a UUID
    assert.match(body.token, /^[0-9a-f-]{36}$/)
    // invite_url must contain only the token — no class name or PII
    assert.include(body.invite_url, `/join/${body.token}`)
    assert.notInclude(body.invite_url, 'Brazilian')
    assert.notInclude(body.invite_url, 'Alice')
    assert.isString(body.id)
    assert.exists(body.expires_at)
  })

  test('non-owner teacher → 403', async ({ client }) => {
    const teacherA = await registerTeacher(client)
    const teacherB = await registerTeacher(client, { email: 'teacher2@example.com' })

    const cls = await createClass(client, teacherA.token)
    const classId = cls.body().id

    const response = await createInvitation(client, teacherB.token, classId)
    response.assertStatus(403)
  })

  test('student token → 403', async ({ client }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)

    const cls = await createClass(client, teacher.token)
    const classId = cls.body().id

    const response = await createInvitation(client, student.token, classId)
    response.assertStatus(403)
  })

  test('expires_at in the past → 422', async ({ client }) => {
    const { token } = await registerTeacher(client)
    const cls = await createClass(client, token)
    const classId = cls.body().id

    const response = await createInvitation(client, token, classId, {
      expires_at: DateTime.now().minus({ days: 1 }).toISO(),
    })
    response.assertStatus(422)
  })

  test('non-existent class → 404', async ({ client }) => {
    const { token } = await registerTeacher(client)

    const response = await createInvitation(client, token, '00000000-0000-0000-0000-000000000000')
    response.assertStatus(404)
  })

  test('audit log written on invitation creation', async ({ client, assert }) => {
    const { token, user } = await registerTeacher(client)
    const cls = await createClass(client, token)
    const classId = cls.body().id

    const response = await createInvitation(client, token, classId)
    const invitationId = response.body().id

    const log = await AuditLog.query()
      .where('user_id', user.id)
      .where('action', 'invitation_created')
      .where('resource_id', invitationId)
      .first()
    assert.exists(log)
  })

  test('with max_uses set → returned in response', async ({ client, assert }) => {
    const { token } = await registerTeacher(client)
    const cls = await createClass(client, token)
    const classId = cls.body().id

    const response = await createInvitation(client, token, classId, { max_uses: 5 })
    response.assertStatus(201)
    assert.equal(response.body().max_uses, 5)
  })
})

// ---------------------------------------------------------------------------
// List invitations
// ---------------------------------------------------------------------------

test.group('Invitations — List', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('teacher sees active non-expired invitations', async ({ client, assert }) => {
    const { token } = await registerTeacher(client)
    const cls = await createClass(client, token)
    const classId = cls.body().id

    await createInvitation(client, token, classId)

    const response = await client
      .get(`/api/v1/classes/${classId}/invitations`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    assert.lengthOf(response.body(), 1)
    assert.exists(response.body()[0].invite_url)
    assert.exists(response.body()[0].use_count)
  })

  test('revoked invitation does not appear in list', async ({ client, assert }) => {
    const { token } = await registerTeacher(client)
    const cls = await createClass(client, token)
    const classId = cls.body().id

    const inv = await createInvitation(client, token, classId)
    const invId = inv.body().id

    await client.delete(`/api/v1/invitations/${invId}`).header('Authorization', `Bearer ${token}`)

    const list = await client
      .get(`/api/v1/classes/${classId}/invitations`)
      .header('Authorization', `Bearer ${token}`)

    assert.notInclude(
      list.body().map((i: any) => i.id),
      invId
    )
  })

  test('non-owner teacher → 403', async ({ client }) => {
    const teacherA = await registerTeacher(client)
    const teacherB = await registerTeacher(client, { email: 'teacher2@example.com' })

    const cls = await createClass(client, teacherA.token)
    const classId = cls.body().id

    const response = await client
      .get(`/api/v1/classes/${classId}/invitations`)
      .header('Authorization', `Bearer ${teacherB.token}`)

    response.assertStatus(403)
  })
})

// ---------------------------------------------------------------------------
// Revoke invitation
// ---------------------------------------------------------------------------

test.group('Invitations — Revoke', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('teacher revokes own invitation → 204, is_active set to false', async ({
    client,
    assert,
  }) => {
    const { token } = await registerTeacher(client)
    const cls = await createClass(client, token)
    const classId = cls.body().id

    const inv = await createInvitation(client, token, classId)
    const invId = inv.body().id

    const response = await client
      .delete(`/api/v1/invitations/${invId}`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(204)

    const row = await db.from('invitations').where('id', invId).first()
    assert.isFalse(row.is_active)
  })

  test('non-owner teacher cannot revoke → 403', async ({ client }) => {
    const teacherA = await registerTeacher(client)
    const teacherB = await registerTeacher(client, { email: 'teacher2@example.com' })

    const cls = await createClass(client, teacherA.token)
    const classId = cls.body().id

    const inv = await createInvitation(client, teacherA.token, classId)
    const invId = inv.body().id

    const response = await client
      .delete(`/api/v1/invitations/${invId}`)
      .header('Authorization', `Bearer ${teacherB.token}`)

    response.assertStatus(403)
  })

  test('audit log written on revocation', async ({ client, assert }) => {
    const { token, user } = await registerTeacher(client)
    const cls = await createClass(client, token)
    const classId = cls.body().id

    const inv = await createInvitation(client, token, classId)
    const invId = inv.body().id

    await client.delete(`/api/v1/invitations/${invId}`).header('Authorization', `Bearer ${token}`)

    const log = await AuditLog.query()
      .where('user_id', user.id)
      .where('action', 'invitation_revoked')
      .where('resource_id', invId)
      .first()
    assert.exists(log)
  })
})
