import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import AuditLog from '#models/audit_log'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function registerUser(client: any, overrides: Record<string, unknown> = {}) {
  return client.post('/api/v1/auth/register').json({
    email: 'test@example.com',
    password: 'password123',
    first_name: 'John',
    profile_type: 'student',
    ...overrides,
  })
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

test.group('Auth — Register', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('happy path: 201 with token and user shape', async ({ client, assert }) => {
    const response = await registerUser(client)

    response.assertStatus(201)
    const body = response.body()
    assert.isString(body.token)
    assert.isTrue(body.token.length > 0)
    assert.equal(body.user.first_name, 'John')
    assert.equal(body.user.profile_type, 'student')
    assert.isString(body.user.id)
    assert.notExists(body.user.password_hash)
  })

  test('token is opaque (not a JWT)', async ({ client, assert }) => {
    const response = await registerUser(client)
    const { token } = response.body()
    // A JWT has exactly 3 base64url segments separated by dots
    const parts = token.split('.')
    assert.isFalse(parts.length === 3, 'token must not be a JWT with 3 dot-separated segments')
  })

  test('password not stored in plaintext', async ({ client, assert }) => {
    await registerUser(client)
    const user = await User.query().whereRaw("first_name = 'John'").firstOrFail()
    assert.notEqual(user.passwordHash, 'password123')
    assert.isTrue(user.passwordHash.length > 20)
  })

  test('registering as student creates student_profiles row', async ({ client, assert }) => {
    const response = await registerUser(client, { profile_type: 'student' })
    const { user } = response.body()
    const row = await db.from('student_profiles').where('user_id', user.id).first()
    assert.exists(row)
  })

  test('registering as teacher creates teacher_profiles row', async ({ client, assert }) => {
    const response = await registerUser(client, {
      email: 'teacher@example.com',
      profile_type: 'teacher',
    })
    const { user } = response.body()
    const row = await db.from('teacher_profiles').where('user_id', user.id).first()
    assert.exists(row)
  })

  test('duplicate email returns 422 with generic message', async ({ client, assert }) => {
    await registerUser(client)
    const second = await registerUser(client)

    second.assertStatus(422)
    // Error must not reveal "email already exists"
    const body = second.body()
    assert.notInclude(JSON.stringify(body).toLowerCase(), 'already exists')
    assert.notInclude(JSON.stringify(body).toLowerCase(), 'taken')
  })

  test('missing first_name returns 422', async ({ client }) => {
    const response = await client.post('/api/v1/auth/register').json({
      email: 'test@example.com',
      password: 'password123',
      profile_type: 'student',
    })
    response.assertStatus(422)
  })

  test('invalid email returns 422', async ({ client }) => {
    const response = await registerUser(client, { email: 'not-an-email' })
    response.assertStatus(422)
  })

  test('short password (< 8 chars) returns 422', async ({ client }) => {
    const response = await registerUser(client, { password: 'short' })
    response.assertStatus(422)
  })
})

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

test.group('Auth — Login', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('happy path: 200 with token', async ({ client, assert }) => {
    await registerUser(client)
    const response = await client.post('/api/v1/auth/login').json({
      email: 'test@example.com',
      password: 'password123',
    })
    response.assertStatus(200)
    assert.isString(response.body().token)
  })

  test('wrong password returns 400 or 401', async ({ client }) => {
    await registerUser(client)
    const response = await client.post('/api/v1/auth/login').json({
      email: 'test@example.com',
      password: 'wrongpassword',
    })
    // AdonisJS verifyCredentials throws E_INVALID_CREDENTIALS → 400
    assert.isTrue([400, 401].includes(response.status()))
  })

  test('login creates audit_log entry with action=login', async ({ client, assert }) => {
    await registerUser(client)
    const loginResp = await client.post('/api/v1/auth/login').json({
      email: 'test@example.com',
      password: 'password123',
    })
    const { user } = loginResp.body()
    const log = await AuditLog.query().where('user_id', user.id).where('action', 'login').first()
    assert.exists(log)
  })
})

// ---------------------------------------------------------------------------
// Token opacity
// ---------------------------------------------------------------------------

test.group('Auth — Token opacity', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('issued token is not a JWT', async ({ client, assert }) => {
    const response = await registerUser(client)
    const { token } = response.body()
    const parts = token.split('.')
    assert.isFalse(parts.length === 3)
  })
})

// ---------------------------------------------------------------------------
// Auth guard
// ---------------------------------------------------------------------------

test.group('Auth — Guard', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('GET /me without token returns 401', async ({ client }) => {
    const response = await client.get('/api/v1/auth/me')
    response.assertStatus(401)
  })

  test('GET /me with valid token returns 200 and user data', async ({ client, assert }) => {
    const reg = await registerUser(client)
    const { token, user } = reg.body()

    const response = await client.get('/api/v1/auth/me').header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    assert.equal(response.body().id, user.id)
    assert.equal(response.body().email, 'test@example.com')
    assert.notExists(response.body().password_hash)
  })

  test('GET /me always returns own data (data isolation)', async ({ client, assert }) => {
    // Register user A
    const regA = await registerUser(client, { email: 'a@example.com' })
    const tokenA = regA.body().token

    // Register user B
    const regB = await registerUser(client, { email: 'b@example.com' })

    // User A's token can only see user A's data
    const response = await client.get('/api/v1/auth/me').header('Authorization', `Bearer ${tokenA}`)

    response.assertStatus(200)
    assert.equal(response.body().id, regA.body().user.id)
    assert.notEqual(response.body().id, regB.body().user.id)
  })
})

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

test.group('Auth — Logout', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('logout revokes the token; subsequent request returns 401', async ({ client }) => {
    const reg = await registerUser(client)
    const { token } = reg.body()

    const logout = await client
      .delete('/api/v1/auth/logout')
      .header('Authorization', `Bearer ${token}`)

    logout.assertStatus(204)

    const after = await client.get('/api/v1/auth/me').header('Authorization', `Bearer ${token}`)

    after.assertStatus(401)
  })
})

// ---------------------------------------------------------------------------
// Account deletion
// ---------------------------------------------------------------------------

test.group('Auth — Account deletion', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('DELETE /me sets deleted_at and anonymises PII', async ({ client, assert }) => {
    const reg = await registerUser(client)
    const { token, user } = reg.body()

    const del = await client.delete('/api/v1/auth/me').header('Authorization', `Bearer ${token}`)

    del.assertStatus(204)

    // deleted_at must be set
    const row = await db.from('users').where('id', user.id).firstOrFail()
    assert.exists(row.deleted_at)

    // email column must not store the original email plaintext
    assert.notEqual(row.email, 'test@example.com')
    // It should be ciphertext (encrypted), not the original value
    assert.isFalse(row.email.includes('test@example.com'))
  })

  test('DELETE /me removes student_profile row', async ({ client, assert }) => {
    const reg = await registerUser(client, { profile_type: 'student' })
    const { token, user } = reg.body()

    await client.delete('/api/v1/auth/me').header('Authorization', `Bearer ${token}`)

    const profile = await db.from('student_profiles').where('user_id', user.id).first()
    assert.isNull(profile)
  })

  test('DELETE /me removes teacher_profile row', async ({ client, assert }) => {
    const reg = await registerUser(client, {
      email: 'teacher@example.com',
      profile_type: 'teacher',
    })
    const { token, user } = reg.body()

    await client.delete('/api/v1/auth/me').header('Authorization', `Bearer ${token}`)

    const profile = await db.from('teacher_profiles').where('user_id', user.id).first()
    assert.isNull(profile)
  })

  test('no PII remains after deletion', async ({ client, assert }) => {
    const reg = await registerUser(client)
    const { token, user } = reg.body()

    await client.delete('/api/v1/auth/me').header('Authorization', `Bearer ${token}`)

    const row = await db.from('users').where('id', user.id).firstOrFail()
    // Raw DB values must not contain recognisable PII
    assert.notEqual(row.first_name, 'John')
    assert.isFalse((row.email ?? '').includes('test@example.com'))
  })

  test('token is revoked after deletion', async ({ client }) => {
    const reg = await registerUser(client)
    const { token } = reg.body()

    await client.delete('/api/v1/auth/me').header('Authorization', `Bearer ${token}`)

    const after = await client.get('/api/v1/auth/me').header('Authorization', `Bearer ${token}`)

    after.assertStatus(401)
  })
})
