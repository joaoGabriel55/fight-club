import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function registerUser(client: any, overrides: Record<string, unknown> = {}) {
  return client.post('/api/v1/auth/register').json({
    email: 'profile-test@example.com',
    password: 'password123',
    first_name: 'Jane',
    profile_type: 'student',
    birth_date: '2000-01-01',
    ...overrides,
  })
}

// ---------------------------------------------------------------------------
// Profile update — fight_experience (student)
// ---------------------------------------------------------------------------

test.group('Profile — Student fight_experience', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('student can set fight_experience array', async ({ client, assert }) => {
    const reg = await registerUser(client)
    const { token } = reg.body()

    const response = await client
      .put('/api/v1/auth/me')
      .header('Authorization', `Bearer ${token}`)
      .json({
        fight_experience: [
          { martial_art: 'Boxing', experience_years: 3, competition_level: 'amateur' },
          { martial_art: 'Judo', experience_years: 1, belt_level: 'Yellow' },
        ],
      })

    response.assertStatus(200)
    const body = response.body()
    assert.isArray(body.student_profile.fight_experience)
    assert.lengthOf(body.student_profile.fight_experience, 2)
    assert.equal(body.student_profile.fight_experience[0].martial_art, 'Boxing')
    assert.equal(body.student_profile.fight_experience[0].experience_years, 3)
    assert.equal(body.student_profile.fight_experience[0].competition_level, 'amateur')
    assert.equal(body.student_profile.fight_experience[1].belt_level, 'Yellow')
  })

  test('student can set belt_level and competition_level', async ({ client, assert }) => {
    const reg = await registerUser(client)
    const { token } = reg.body()

    const response = await client
      .put('/api/v1/auth/me')
      .header('Authorization', `Bearer ${token}`)
      .json({
        fight_experience: [
          {
            martial_art: 'Brazilian Jiu-Jitsu (BJJ)',
            experience_years: 5,
            belt_level: 'Purple',
            competition_level: 'professional',
          },
        ],
      })

    response.assertStatus(200)
    const exp = response.body().student_profile.fight_experience[0]
    assert.equal(exp.belt_level, 'Purple')
    assert.equal(exp.competition_level, 'professional')
  })

  test('belt_level and competition_level are optional (nullable)', async ({ client, assert }) => {
    const reg = await registerUser(client)
    const { token } = reg.body()

    const response = await client
      .put('/api/v1/auth/me')
      .header('Authorization', `Bearer ${token}`)
      .json({
        fight_experience: [
          {
            martial_art: 'Boxing',
            experience_years: 2,
            belt_level: null,
            competition_level: null,
          },
        ],
      })

    response.assertStatus(200)
    const exp = response.body().student_profile.fight_experience[0]
    assert.isNull(exp.belt_level)
    assert.isNull(exp.competition_level)
  })

  test('student can update fight_experience to null', async ({ client, assert }) => {
    const reg = await registerUser(client)
    const { token } = reg.body()

    // Set it first
    await client
      .put('/api/v1/auth/me')
      .header('Authorization', `Bearer ${token}`)
      .json({
        fight_experience: [{ martial_art: 'Boxing', experience_years: 2 }],
      })

    // Clear it
    const response = await client
      .put('/api/v1/auth/me')
      .header('Authorization', `Bearer ${token}`)
      .json({ fight_experience: null })

    response.assertStatus(200)
    assert.isNull(response.body().student_profile.fight_experience)
  })

  test('student can update weight, height, and fight_experience together', async ({
    client,
    assert,
  }) => {
    const reg = await registerUser(client)
    const { token } = reg.body()

    const response = await client
      .put('/api/v1/auth/me')
      .header('Authorization', `Bearer ${token}`)
      .json({
        weight_kg: '80',
        height_cm: '175',
        fight_experience: [
          {
            martial_art: 'Muay Thai',
            experience_years: 5,
            competition_level: 'amateur',
          },
        ],
      })

    response.assertStatus(200)
    assert.equal(response.body().student_profile.weight_kg, '80')
    assert.equal(response.body().student_profile.height_cm, '175')
    assert.lengthOf(response.body().student_profile.fight_experience, 1)
    assert.equal(response.body().student_profile.fight_experience[0].competition_level, 'amateur')
  })

  test('GET /me returns fight_experience with all fields', async ({ client, assert }) => {
    const reg = await registerUser(client)
    const { token } = reg.body()

    await client
      .put('/api/v1/auth/me')
      .header('Authorization', `Bearer ${token}`)
      .json({
        fight_experience: [
          {
            martial_art: 'Karate',
            experience_years: 10,
            belt_level: 'Black',
            competition_level: 'professional',
          },
        ],
      })

    const response = await client.get('/api/v1/auth/me').header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    const exp = response.body().student_profile.fight_experience[0]
    assert.equal(exp.martial_art, 'Karate')
    assert.equal(exp.belt_level, 'Black')
    assert.equal(exp.competition_level, 'professional')
  })

  test('invalid martial_art returns 422', async ({ client }) => {
    const reg = await registerUser(client)
    const { token } = reg.body()

    const response = await client
      .put('/api/v1/auth/me')
      .header('Authorization', `Bearer ${token}`)
      .json({
        fight_experience: [{ martial_art: 'Invalid Art', experience_years: 1 }],
      })

    response.assertStatus(422)
  })

  test('invalid belt_level returns 422', async ({ client }) => {
    const reg = await registerUser(client)
    const { token } = reg.body()

    const response = await client
      .put('/api/v1/auth/me')
      .header('Authorization', `Bearer ${token}`)
      .json({
        fight_experience: [{ martial_art: 'Judo', experience_years: 3, belt_level: 'Rainbow' }],
      })

    response.assertStatus(422)
  })

  test('invalid competition_level returns 422', async ({ client }) => {
    const reg = await registerUser(client)
    const { token } = reg.body()

    const response = await client
      .put('/api/v1/auth/me')
      .header('Authorization', `Bearer ${token}`)
      .json({
        fight_experience: [
          { martial_art: 'Boxing', experience_years: 1, competition_level: 'legendary' },
        ],
      })

    response.assertStatus(422)
  })

  test('experience_years > 50 returns 422', async ({ client }) => {
    const reg = await registerUser(client)
    const { token } = reg.body()

    const response = await client
      .put('/api/v1/auth/me')
      .header('Authorization', `Bearer ${token}`)
      .json({
        fight_experience: [{ martial_art: 'Boxing', experience_years: 51 }],
      })

    response.assertStatus(422)
  })
})

// ---------------------------------------------------------------------------
// Profile update — fight_experience (teacher)
// ---------------------------------------------------------------------------

test.group('Profile — Teacher fight_experience', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('teacher can set fight_experience with belt and competition level', async ({
    client,
    assert,
  }) => {
    const reg = await registerUser(client, {
      email: 'teacher-profile@example.com',
      profile_type: 'teacher',
    })
    const { token } = reg.body()

    const response = await client
      .put('/api/v1/auth/me')
      .header('Authorization', `Bearer ${token}`)
      .json({
        fight_experience: [
          {
            martial_art: 'Brazilian Jiu-Jitsu (BJJ)',
            experience_years: 15,
            belt_level: 'Black',
            competition_level: 'professional',
          },
          {
            martial_art: 'Wrestling',
            experience_years: 8,
            competition_level: 'amateur',
          },
        ],
      })

    response.assertStatus(200)
    const fe = response.body().teacher_profile.fight_experience
    assert.isArray(fe)
    assert.lengthOf(fe, 2)
    assert.equal(fe[0].martial_art, 'Brazilian Jiu-Jitsu (BJJ)')
    assert.equal(fe[0].belt_level, 'Black')
    assert.equal(fe[0].competition_level, 'professional')
    assert.equal(fe[1].competition_level, 'amateur')
  })

  test('GET /me returns fight_experience for teacher', async ({ client, assert }) => {
    const reg = await registerUser(client, {
      email: 'teacher2@example.com',
      profile_type: 'teacher',
    })
    const { token } = reg.body()

    await client
      .put('/api/v1/auth/me')
      .header('Authorization', `Bearer ${token}`)
      .json({
        fight_experience: [
          {
            martial_art: 'Sambo',
            experience_years: 4,
            competition_level: 'amateur',
          },
        ],
      })

    const response = await client.get('/api/v1/auth/me').header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    const exp = response.body().teacher_profile.fight_experience[0]
    assert.equal(exp.martial_art, 'Sambo')
    assert.equal(exp.competition_level, 'amateur')
  })

  test('teacher weight_kg/height_cm are ignored', async ({ client, assert }) => {
    const reg = await registerUser(client, {
      email: 'teacher3@example.com',
      profile_type: 'teacher',
    })
    const { token } = reg.body()

    const response = await client
      .put('/api/v1/auth/me')
      .header('Authorization', `Bearer ${token}`)
      .json({ weight_kg: '90', height_cm: '180' })

    response.assertStatus(200)
    assert.isNull(response.body().student_profile)
  })
})

// ---------------------------------------------------------------------------
// Profile update — basic fields
// ---------------------------------------------------------------------------

test.group('Profile — Basic fields update', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('user can update first_name and last_name', async ({ client, assert }) => {
    const reg = await registerUser(client)
    const { token } = reg.body()

    const response = await client
      .put('/api/v1/auth/me')
      .header('Authorization', `Bearer ${token}`)
      .json({ first_name: 'Updated', last_name: 'Name' })

    response.assertStatus(200)
    assert.equal(response.body().first_name, 'Updated')
    assert.equal(response.body().last_name, 'Name')
  })
})

// ---------------------------------------------------------------------------
// Avatar URL proxying
// ---------------------------------------------------------------------------

test.group('Profile — Avatar URL proxying', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('PUT /me with avatar_url returns proxied URL in response', async ({ client, assert }) => {
    const reg = await registerUser(client)
    const { token } = reg.body()

    const response = await client
      .put('/api/v1/auth/me')
      .header('Authorization', `Bearer ${token}`)
      .json({ avatar_url: 'https://storage.supabase.co/bucket/avatars/abc123.jpg' })

    response.assertStatus(200)
    assert.equal(response.body().avatar_url, '/api/v1/avatars/abc123.jpg')
  })

  test('GET /me returns proxied avatar_url', async ({ client, assert }) => {
    const reg = await registerUser(client)
    const { token } = reg.body()

    await client
      .put('/api/v1/auth/me')
      .header('Authorization', `Bearer ${token}`)
      .json({ avatar_url: '/api/v1/dev/avatars/myfile.jpg' })

    const me = await client.get('/api/v1/auth/me').header('Authorization', `Bearer ${token}`)

    me.assertStatus(200)
    assert.equal(me.body().avatar_url, '/api/v1/avatars/myfile.jpg')
  })

  test('PUT /me with avatar_url null clears avatar', async ({ client, assert }) => {
    const reg = await registerUser(client)
    const { token } = reg.body()

    // Set it first
    await client
      .put('/api/v1/auth/me')
      .header('Authorization', `Bearer ${token}`)
      .json({ avatar_url: 'https://example.com/avatar.jpg' })

    // Clear it
    const response = await client
      .put('/api/v1/auth/me')
      .header('Authorization', `Bearer ${token}`)
      .json({ avatar_url: null })

    response.assertStatus(200)
    assert.isNull(response.body().avatar_url)
  })
})
