import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function registerTeacher(
  client: any,
  overrides: Record<string, unknown> = {}
): Promise<{ token: string; user: { id: string } }> {
  const response = await client.post('/api/v1/auth/register').json({
    email: `pii-teacher-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    password: 'Password123!',
    first_name: 'PiiTeacher',
    profile_type: 'teacher',
    birth_date: '1985-01-01',
    ...overrides,
  })
  return response.body()
}

async function registerStudent(
  client: any,
  overrides: Record<string, unknown> = {}
): Promise<{ token: string; user: { id: string } }> {
  const response = await client.post('/api/v1/auth/register').json({
    email: `pii-student-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    password: 'Password123!',
    first_name: 'PiiStudent',
    last_name: 'SecretLastName',
    profile_type: 'student',
    birth_date: '2000-05-15',
    ...overrides,
  })
  return response.body()
}

// ---------------------------------------------------------------------------
// PII in API Responses Tests
// ---------------------------------------------------------------------------

test.group('Privacy — PII in API: Students endpoint', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('GET /classes/:id/students does not contain email, last_name, birth_date, weight_kg, height_cm', async ({
    client,
    assert,
  }) => {
    const teacher = await registerTeacher(client, { email: 'pii-teacher-stu@test.com' })
    const student = await registerStudent(client, {
      email: 'pii-student-stu@test.com',
      last_name: 'VerySecretName',
      birth_date: '1998-12-25',
    })

    // Update student profile with weight/height
    await client
      .put('/api/v1/auth/me')
      .header('Authorization', `Bearer ${student.token}`)
      .json({ weight_kg: '80', height_cm: '175' })

    // Create class and enroll student
    const classResp = await client
      .post('/api/v1/classes')
      .header('Authorization', `Bearer ${teacher.token}`)
      .json({
        name: 'PII Test Class',
        martial_art: 'BJJ',
        has_belt_system: true,
        schedules: [{ day_of_week: 1, start_time: '09:00', end_time: '10:00' }],
      })
    const cls = classResp.body()

    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 7)
    const invResp = await client
      .post(`/api/v1/classes/${cls.id}/invitations`)
      .header('Authorization', `Bearer ${teacher.token}`)
      .json({ expires_at: futureDate.toISOString() })
    const invToken = invResp.body().token

    await client
      .post(`/api/v1/join/${invToken}`)
      .header('Authorization', `Bearer ${student.token}`)
      .json({ consent: true })

    // Get students list
    const response = await client
      .get(`/api/v1/classes/${cls.id}/students`)
      .header('Authorization', `Bearer ${teacher.token}`)

    response.assertStatus(200)
    const students = response.body()
    assert.isArray(students)
    assert.isTrue(students.length > 0)

    const responseText = JSON.stringify(students)

    // Must NOT contain sensitive PII fields
    for (const studentItem of students) {
      assert.notExists(studentItem.email, 'email should not be in student response')
      assert.notExists(studentItem.last_name, 'last_name should not be in student response')
      assert.notExists(studentItem.birth_date, 'birth_date should not be in student response')
      assert.notExists(studentItem.weight_kg, 'weight_kg should not be in student response')
      assert.notExists(studentItem.height_cm, 'height_cm should not be in student response')
      assert.notExists(studentItem.password_hash, 'password_hash should not be in student response')
      assert.notExists(studentItem.email_hash, 'email_hash should not be in student response')
    }

    // Double-check: sensitive values must not appear anywhere in the serialized response
    assert.isFalse(responseText.includes('pii-student-stu@test.com'))
    assert.isFalse(responseText.includes('VerySecretName'))
    assert.isFalse(responseText.includes('1998-12-25'))
  })
})

test.group('Privacy — PII in API: Announcements', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('GET /announcements does not expose author_id as a raw field', async ({
    client,
    assert,
  }) => {
    const teacher = await registerTeacher(client, { email: 'pii-teacher-ann@test.com' })
    const student = await registerStudent(client, { email: 'pii-student-ann@test.com' })

    // Create class, enroll student, create announcement
    const classResp = await client
      .post('/api/v1/classes')
      .header('Authorization', `Bearer ${teacher.token}`)
      .json({
        name: 'Announcement PII Class',
        martial_art: 'Judo',
        has_belt_system: false,
        schedules: [{ day_of_week: 4, start_time: '16:00', end_time: '17:00' }],
      })
    const cls = classResp.body()

    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 7)
    const invResp = await client
      .post(`/api/v1/classes/${cls.id}/invitations`)
      .header('Authorization', `Bearer ${teacher.token}`)
      .json({ expires_at: futureDate.toISOString() })
    const invToken = invResp.body().token

    await client
      .post(`/api/v1/join/${invToken}`)
      .header('Authorization', `Bearer ${student.token}`)
      .json({ consent: true })

    await client
      .post(`/api/v1/classes/${cls.id}/announcements`)
      .header('Authorization', `Bearer ${teacher.token}`)
      .json({ title: 'Test Announcement', content: 'Hello students' })

    // Student reads aggregate announcements
    const response = await client
      .get('/api/v1/announcements')
      .header('Authorization', `Bearer ${student.token}`)

    response.assertStatus(200)
    const body = response.body()
    const announcements = body.data || body
    assert.isTrue(announcements.length > 0)

    for (const announcement of announcements) {
      // Should have author.first_name but NOT raw author_id
      assert.notExists(announcement.author_id, 'author_id should not be exposed')
      assert.exists(announcement.author, 'author object should exist')
      assert.exists(announcement.author.first_name, 'author.first_name should exist')
    }

    // Also check class-level announcements endpoint
    const classAnnResp = await client
      .get(`/api/v1/classes/${cls.id}/announcements`)
      .header('Authorization', `Bearer ${student.token}`)

    classAnnResp.assertStatus(200)
    const classAnnouncements = classAnnResp.body()
    for (const announcement of classAnnouncements) {
      assert.notExists(
        announcement.author_id,
        'author_id should not be exposed in class announcements'
      )
    }
  })
})

test.group('Privacy — PII in API: Token format', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('auth tokens are opaque and do not decode as JWTs', async ({ client, assert }) => {
    const response = await client.post('/api/v1/auth/register').json({
      email: 'jwt-check@test.com',
      password: 'Password123!',
      first_name: 'JwtCheck',
      profile_type: 'student',
      birth_date: '2000-01-01',
    })

    const { token } = response.body()

    assert.isString(token)
    assert.isTrue(token.length > 0)

    // A JWT has exactly 3 base64url segments separated by dots
    const parts = token.split('.')
    assert.isFalse(parts.length === 3, 'Token must not be a JWT with 3 dot-separated segments')

    // Also verify login token
    const loginResp = await client.post('/api/v1/auth/login').json({
      email: 'jwt-check@test.com',
      password: 'Password123!',
    })
    const loginToken = loginResp.body().token
    const loginParts = loginToken.split('.')
    assert.isFalse(
      loginParts.length === 3,
      'Login token must not be a JWT with 3 dot-separated segments'
    )
  })
})

test.group('Privacy — PII in API: Invitation URLs', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('invitation URLs contain only UUID token, no class name or PII', async ({
    client,
    assert,
  }) => {
    const teacher = await registerTeacher(client, { email: 'pii-teacher-inv@test.com' })

    const className = 'Super Secret Dojo Name'
    const classResp = await client
      .post('/api/v1/classes')
      .header('Authorization', `Bearer ${teacher.token}`)
      .json({
        name: className,
        martial_art: 'Muay Thai',
        has_belt_system: false,
        schedules: [{ day_of_week: 5, start_time: '18:00', end_time: '19:00' }],
      })
    const cls = classResp.body()

    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 7)
    const invResp = await client
      .post(`/api/v1/classes/${cls.id}/invitations`)
      .header('Authorization', `Bearer ${teacher.token}`)
      .json({ expires_at: futureDate.toISOString() })

    invResp.assertStatus(201)
    const invitation = invResp.body()

    assert.exists(invitation.invite_url)
    const inviteUrl = invitation.invite_url as string

    // URL should contain a UUID token
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
    assert.isTrue(uuidRegex.test(inviteUrl), 'Invite URL should contain a UUID token')

    // URL must NOT contain class name or teacher PII
    assert.isFalse(inviteUrl.includes(className), 'Invite URL must not contain the class name')
    assert.isFalse(inviteUrl.includes('PiiTeacher'), 'Invite URL must not contain the teacher name')
    assert.isFalse(
      inviteUrl.includes('pii-teacher-inv@test.com'),
      'Invite URL must not contain the teacher email'
    )

    // URL should be in format: <base>/join/<uuid>
    assert.isTrue(inviteUrl.includes('/join/'), 'Invite URL should use /join/ path')

    // The token in the URL should be just a UUID
    const tokenInUrl = inviteUrl.split('/join/')[1]
    assert.isTrue(uuidRegex.test(tokenInUrl), 'Token portion should be a valid UUID')
  })
})
