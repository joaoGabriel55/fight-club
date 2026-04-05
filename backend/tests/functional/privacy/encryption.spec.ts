import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function registerUser(
  client: any,
  overrides: Record<string, unknown> = {}
): Promise<{ token: string; user: { id: string } }> {
  const response = await client.post('/api/v1/auth/register').json({
    email: `enc-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    password: 'Password123!',
    first_name: 'EncTest',
    last_name: 'SecretLastName',
    profile_type: 'student',
    birth_date: '1995-06-15',
    ...overrides,
  })
  return response.body()
}

async function registerTeacher(
  client: any,
  overrides: Record<string, unknown> = {}
): Promise<{ token: string; user: { id: string } }> {
  const response = await client.post('/api/v1/auth/register').json({
    email: `enc-teacher-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    password: 'Password123!',
    first_name: 'EncTeacher',
    profile_type: 'teacher',
    birth_date: '1985-03-20',
    ...overrides,
  })
  return response.body()
}

// ---------------------------------------------------------------------------
// Encryption Tests — raw DB values vs plaintext
// ---------------------------------------------------------------------------

test.group('Privacy — Encryption: User email', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('users.email is stored as ciphertext in the database', async ({ client, assert }) => {
    const plainEmail = 'plaintext-check@encryption-test.com'
    const { user } = await registerUser(client, { email: plainEmail })

    // Raw DB query bypasses model consume hooks
    const rawRow = await db.from('users').where('id', user.id).firstOrFail()

    // The raw email column must NOT contain the plaintext email
    assert.notEqual(rawRow.email, plainEmail)
    // It should be a longer encrypted string
    assert.isTrue(
      rawRow.email.length > plainEmail.length,
      'Encrypted email should be longer than plaintext'
    )
  })
})

test.group('Privacy — Encryption: User last_name', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('users.last_name is stored as ciphertext in the database', async ({ client, assert }) => {
    const plainLastName = 'SuperSecretLastName'
    const { user } = await registerUser(client, { last_name: plainLastName })

    const rawRow = await db.from('users').where('id', user.id).firstOrFail()

    assert.notEqual(rawRow.last_name, plainLastName)
    assert.isTrue(
      rawRow.last_name.length > plainLastName.length,
      'Encrypted last_name should be longer than plaintext'
    )
  })
})

test.group('Privacy — Encryption: User birth_date', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('users.birth_date is stored as ciphertext in the database', async ({ client, assert }) => {
    const plainBirthDate = '1995-06-15'
    const { user } = await registerUser(client, { birth_date: plainBirthDate })

    const rawRow = await db.from('users').where('id', user.id).firstOrFail()

    assert.notEqual(rawRow.birth_date, plainBirthDate)
    assert.isTrue(
      rawRow.birth_date.length > plainBirthDate.length,
      'Encrypted birth_date should be longer than plaintext'
    )
  })
})

test.group('Privacy — Encryption: Feedback content', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('feedback.content is stored as ciphertext in the database', async ({ client, assert }) => {
    const teacher = await registerTeacher(client, { email: 'teacher-enc-fb@test.com' })
    const student = await registerUser(client, { email: 'student-enc-fb@test.com' })

    // Create class
    const classResp = await client
      .post('/api/v1/classes')
      .header('Authorization', `Bearer ${teacher.token}`)
      .json({
        name: 'Encryption Test Class',
        martial_art: 'Karate',
        has_belt_system: false,
        schedules: [{ day_of_week: 3, start_time: '14:00', end_time: '15:00' }],
      })
    const cls = classResp.body()

    // Create invitation and enroll student
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 7)
    const invResp = await client
      .post(`/api/v1/classes/${cls.id}/invitations`)
      .header('Authorization', `Bearer ${teacher.token}`)
      .json({ expires_at: futureDate.toISOString() })
    const invToken = invResp.body().token

    const enrollResp = await client
      .post(`/api/v1/join/${invToken}`)
      .header('Authorization', `Bearer ${student.token}`)
      .json({ consent: true })
    const enrollment = enrollResp.body()

    // Send feedback
    const plainContent = 'This is very private feedback about the student performance'
    await client
      .post(`/api/v1/enrollments/${enrollment.id}/feedback`)
      .header('Authorization', `Bearer ${teacher.token}`)
      .json({ content: plainContent })

    // Check raw DB
    const rawFeedback = await db
      .from('feedback')
      .where('enrollment_id', enrollment.id)
      .firstOrFail()

    assert.notEqual(rawFeedback.content, plainContent)
    assert.isTrue(
      rawFeedback.content.length > plainContent.length,
      'Encrypted content should be longer than plaintext'
    )
  })
})

test.group('Privacy — Encryption: Decryption works on API read', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('encrypted fields decrypt correctly when read via API', async ({ client, assert }) => {
    const plainEmail = 'decrypt-check@encryption-test.com'
    const plainLastName = 'DecryptableLastName'
    const plainBirthDate = '1992-11-25'

    const { token } = await registerUser(client, {
      email: plainEmail,
      last_name: plainLastName,
      birth_date: plainBirthDate,
    })

    // Read via GET /auth/me — should return decrypted values
    const meResp = await client.get('/api/v1/auth/me').header('Authorization', `Bearer ${token}`)

    meResp.assertStatus(200)
    const me = meResp.body()

    assert.equal(me.email, plainEmail)
    assert.equal(me.last_name, plainLastName)
    assert.equal(me.birth_date, plainBirthDate)
  })
})

test.group('Privacy — Encryption: student_profiles weight and height are plain', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('student_profiles.weight_kg and height_cm are readable via API', async ({
    client,
    assert,
  }) => {
    const { token } = await registerUser(client, { email: 'profile-enc@test.com' })

    // Update student profile with weight and height
    await client
      .put('/api/v1/auth/me')
      .header('Authorization', `Bearer ${token}`)
      .json({ weight_kg: '75.5', height_cm: '180' })

    // Read back
    const meResp = await client.get('/api/v1/auth/me').header('Authorization', `Bearer ${token}`)

    meResp.assertStatus(200)
    const me = meResp.body()
    assert.equal(me.student_profile.weight_kg, '75.5')
    assert.equal(me.student_profile.height_cm, '180')
  })
})
