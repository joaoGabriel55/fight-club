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

async function createReview(
  client: any,
  token: string,
  classId: string,
  overrides: Record<string, unknown> = {}
) {
  const today = DateTime.now().toISODate()
  return client
    .post(`/api/v1/classes/${classId}/reviews`)
    .header('Authorization', `Bearer ${token}`)
    .json({
      rating: 4,
      comment: 'Great class!',
      session_date: today,
      ...overrides,
    })
}

async function updateReview(
  client: any,
  token: string,
  classId: string,
  reviewId: string,
  overrides: Record<string, unknown> = {}
) {
  return client
    .put(`/api/v1/classes/${classId}/reviews/${reviewId}`)
    .header('Authorization', `Bearer ${token}`)
    .json({
      rating: 5,
      comment: 'Updated comment',
      ...overrides,
    })
}

// ---------------------------------------------------------------------------
// Create review
// ---------------------------------------------------------------------------

test.group('Reviews — Create', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('happy path: enrolled student creates review → 201', async ({ client, assert }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    await createInvitationAndJoin(client, teacher.token, student.token, cls.id)

    const today = DateTime.now().toISODate()
    const response = await client
      .post(`/api/v1/classes/${cls.id}/reviews`)
      .header('Authorization', `Bearer ${student.token}`)
      .json({
        rating: 4,
        comment: 'Great class!',
        session_date: today,
      })

    response.assertStatus(201)
    const body = response.body()
    assert.exists(body.id)
    assert.equal(body.rating, 4)
    assert.equal(body.comment, 'Great class!')
    assert.equal(body.session_date, today)
  })

  test('not enrolled student → 403', async ({ client }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)

    const today = DateTime.now().toISODate()
    const response = await client
      .post(`/api/v1/classes/${cls.id}/reviews`)
      .header('Authorization', `Bearer ${student.token}`)
      .json({
        rating: 4,
        session_date: today,
      })

    response.assertStatus(403)
  })

  test('teacher → 403', async ({ client }) => {
    const teacher = await registerTeacher(client)
    const cls = await createClass(client, teacher.token)

    const today = DateTime.now().toISODate()
    const response = await client
      .post(`/api/v1/classes/${cls.id}/reviews`)
      .header('Authorization', `Bearer ${teacher.token}`)
      .json({
        rating: 4,
        session_date: today,
      })

    response.assertStatus(403)
  })

  test('duplicate same date → 409', async ({ client }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    await createInvitationAndJoin(client, teacher.token, student.token, cls.id)

    const today = DateTime.now().toISODate()
    await createReview(client, student.token, cls.id, { session_date: today })

    const response = await createReview(client, student.token, cls.id, { session_date: today })

    response.assertStatus(409)
  })

  test('different date OK → 201', async ({ client }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    await createInvitationAndJoin(client, teacher.token, student.token, cls.id)

    const today = DateTime.now().toISODate()
    const yesterday = DateTime.now().minus({ days: 1 }).toISODate()

    await createReview(client, student.token, cls.id, { session_date: today })

    const response = await createReview(client, student.token, cls.id, {
      session_date: yesterday,
    })

    response.assertStatus(201)
  })

  test('validation: rating out of range → 422', async ({ client }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    await createInvitationAndJoin(client, teacher.token, student.token, cls.id)

    const today = DateTime.now().toISODate()
    const response = await client
      .post(`/api/v1/classes/${cls.id}/reviews`)
      .header('Authorization', `Bearer ${student.token}`)
      .json({
        rating: 6,
        session_date: today,
      })

    response.assertStatus(422)
  })

  test('validation: invalid session_date format → 422', async ({ client }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    await createInvitationAndJoin(client, teacher.token, student.token, cls.id)

    const response = await client
      .post(`/api/v1/classes/${cls.id}/reviews`)
      .header('Authorization', `Bearer ${student.token}`)
      .json({
        rating: 4,
        session_date: 'invalid-date',
      })

    response.assertStatus(422)
  })

  test('audit log written on review creation', async ({ client, assert }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    await createInvitationAndJoin(client, teacher.token, student.token, cls.id)

    const today = DateTime.now().toISODate()
    const response = await createReview(client, student.token, cls.id, { session_date: today })
    const reviewId = response.body().id

    const log = await AuditLog.query()
      .where('user_id', student.user.id)
      .where('action', 'review_created')
      .where('resource_id', reviewId)
      .first()
    assert.exists(log)
  })
})

// ---------------------------------------------------------------------------
// Update review
// ---------------------------------------------------------------------------

test.group('Reviews — Update', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('happy path: own review → 200', async ({ client, assert }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    await createInvitationAndJoin(client, teacher.token, student.token, cls.id)

    const today = DateTime.now().toISODate()
    const createResp = await createReview(client, student.token, cls.id, { session_date: today })
    const reviewId = createResp.body().id

    const response = await updateReview(client, student.token, cls.id, reviewId)

    response.assertStatus(200)
    const body = response.body()
    assert.equal(body.rating, 5)
    assert.equal(body.comment, 'Updated comment')
  })

  test('wrong student → 403', async ({ client }) => {
    const teacher = await registerTeacher(client)
    const studentA = await registerStudent(client)
    const studentB = await registerStudent(client, { email: 'student2@example.com' })
    const cls = await createClass(client, teacher.token)
    await createInvitationAndJoin(client, teacher.token, studentA.token, cls.id)
    await createInvitationAndJoin(client, teacher.token, studentB.token, cls.id)

    const today = DateTime.now().toISODate()
    const createResp = await createReview(client, studentA.token, cls.id, { session_date: today })
    const reviewId = createResp.body().id

    const response = await updateReview(client, studentB.token, cls.id, reviewId)

    response.assertStatus(403)
  })

  test('not found → 404', async ({ client }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    await createInvitationAndJoin(client, teacher.token, student.token, cls.id)

    const response = await updateReview(
      client,
      student.token,
      cls.id,
      '00000000-0000-0000-0000-000000000000'
    )

    response.assertStatus(404)
  })
})

// ---------------------------------------------------------------------------
// List reviews (teacher view - anonymous)
// ---------------------------------------------------------------------------

test.group('Reviews — List (teacher)', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('teacher sees anonymous reviews → 200', async ({ client, assert }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    await createInvitationAndJoin(client, teacher.token, student.token, cls.id)

    const today = DateTime.now().toISODate()
    await createReview(client, student.token, cls.id, { session_date: today })

    const response = await client
      .get(`/api/v1/classes/${cls.id}/reviews`)
      .header('Authorization', `Bearer ${teacher.token}`)

    response.assertStatus(200)
    const body = response.body()
    assert.lengthOf(body, 1)
    assert.equal(body[0].rating, 4)
    assert.equal(body[0].comment, 'Great class!')
    assert.isUndefined(body[0].student_id)
    assert.isUndefined(body[0].studentId)
  })

  test('non-owner teacher → 403', async ({ client }) => {
    const teacherA = await registerTeacher(client)
    const teacherB = await registerTeacher(client, { email: 'teacher2@example.com' })
    const cls = await createClass(client, teacherA.token)

    const response = await client
      .get(`/api/v1/classes/${cls.id}/reviews`)
      .header('Authorization', `Bearer ${teacherB.token}`)

    response.assertStatus(403)
  })

  test('student → 403', async ({ client }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    await createInvitationAndJoin(client, teacher.token, student.token, cls.id)

    const response = await client
      .get(`/api/v1/classes/${cls.id}/reviews`)
      .header('Authorization', `Bearer ${student.token}`)

    response.assertStatus(403)
  })

  test('session_date filter → returns filtered', async ({ client, assert }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    await createInvitationAndJoin(client, teacher.token, student.token, cls.id)

    const today = DateTime.now().toISODate()
    const yesterday = DateTime.now().minus({ days: 1 }).toISODate()

    await createReview(client, student.token, cls.id, { session_date: today })
    await createReview(client, student.token, cls.id, {
      session_date: yesterday,
      rating: 3,
    })

    const response = await client
      .get(`/api/v1/classes/${cls.id}/reviews?session_date=${today}`)
      .header('Authorization', `Bearer ${teacher.token}`)

    response.assertStatus(200)
    const body = response.body()
    assert.lengthOf(body, 1)
    assert.equal(body[0].rating, 4)
  })

  test('no student_id in response', async ({ client, assert }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    await createInvitationAndJoin(client, teacher.token, student.token, cls.id)

    const today = DateTime.now().toISODate()
    await createReview(client, student.token, cls.id, { session_date: today })

    const response = await client
      .get(`/api/v1/classes/${cls.id}/reviews`)
      .header('Authorization', `Bearer ${teacher.token}`)

    const body = response.body()
    assert.isUndefined(body[0].student_id)
    assert.isUndefined(body[0].studentId)
  })
})

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

test.group('Reviews — Summary', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('correct avg and count', async ({ client, assert }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    await createInvitationAndJoin(client, teacher.token, student.token, cls.id)

    const today = DateTime.now().toISODate()
    await createReview(client, student.token, cls.id, { rating: 4, session_date: today })

    const response = await client
      .get(`/api/v1/classes/${cls.id}/reviews/summary`)
      .header('Authorization', `Bearer ${teacher.token}`)

    response.assertStatus(200)
    const body = response.body()
    assert.equal(body.average, '4.0')
    assert.equal(body.count, 1)
  })

  test('multiple reviews with different ratings', async ({ client, assert }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    await createInvitationAndJoin(client, teacher.token, student.token, cls.id)

    const today = DateTime.now().toISODate()
    const yesterday = DateTime.now().minus({ days: 1 }).toISODate()

    await createReview(client, student.token, cls.id, { rating: 4, session_date: today })
    await createReview(client, student.token, cls.id, { rating: 5, session_date: yesterday })

    const response = await client
      .get(`/api/v1/classes/${cls.id}/reviews/summary`)
      .header('Authorization', `Bearer ${teacher.token}`)

    response.assertStatus(200)
    const body = response.body()
    assert.equal(body.average, '4.5')
    assert.equal(body.count, 2)
  })

  test('empty class → 0 count', async ({ client, assert }) => {
    const teacher = await registerTeacher(client)
    const cls = await createClass(client, teacher.token)

    const response = await client
      .get(`/api/v1/classes/${cls.id}/reviews/summary`)
      .header('Authorization', `Bearer ${teacher.token}`)

    response.assertStatus(200)
    const body = response.body()
    assert.equal(body.average, null)
    assert.equal(body.count, 0)
  })

  test('non-owner → 403', async ({ client }) => {
    const teacherA = await registerTeacher(client)
    const teacherB = await registerTeacher(client, { email: 'teacher2@example.com' })
    const cls = await createClass(client, teacherA.token)

    const response = await client
      .get(`/api/v1/classes/${cls.id}/reviews/summary`)
      .header('Authorization', `Bearer ${teacherB.token}`)

    response.assertStatus(403)
  })
})

// ---------------------------------------------------------------------------
// My reviews (student view)
// ---------------------------------------------------------------------------

test.group('Reviews — My reviews', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('returns own reviews', async ({ client, assert }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    await createInvitationAndJoin(client, teacher.token, student.token, cls.id)

    const today = DateTime.now().toISODate()
    await createReview(client, student.token, cls.id, { session_date: today })

    const response = await client
      .get(`/api/v1/my-reviews/${cls.id}`)
      .header('Authorization', `Bearer ${student.token}`)

    response.assertStatus(200)
    const body = response.body()
    assert.lengthOf(body, 1)
    assert.equal(body[0].rating, 4)
  })

  test('teacher → 403', async ({ client }) => {
    const teacher = await registerTeacher(client)
    const cls = await createClass(client, teacher.token)

    const response = await client
      .get(`/api/v1/my-reviews/${cls.id}`)
      .header('Authorization', `Bearer ${teacher.token}`)

    response.assertStatus(403)
  })

  test('multiple reviews for different sessions', async ({ client, assert }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    await createInvitationAndJoin(client, teacher.token, student.token, cls.id)

    const today = DateTime.now().toISODate()
    const yesterday = DateTime.now().minus({ days: 1 }).toISODate()

    await createReview(client, student.token, cls.id, { rating: 4, session_date: today })
    await createReview(client, student.token, cls.id, { rating: 3, session_date: yesterday })

    const response = await client
      .get(`/api/v1/my-reviews/${cls.id}`)
      .header('Authorization', `Bearer ${student.token}`)

    response.assertStatus(200)
    const body = response.body()
    assert.lengthOf(body, 2)
  })
})
