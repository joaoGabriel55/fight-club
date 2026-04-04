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
      content: 'Great progress on your guard passing! Keep working on your hip movement.',
      ...overrides,
    })
}

// ---------------------------------------------------------------------------
// Send feedback
// ---------------------------------------------------------------------------

test.group('Feedback — Send', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('happy path: teacher sends feedback → 201', async ({ client, assert }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    const enrollment = await enrollStudent(client, teacher.token, student.token, cls.id)

    const response = await sendFeedback(client, teacher.token, enrollment.id)

    response.assertStatus(201)
    const body = response.body()
    assert.exists(body.id)
    assert.exists(body.content)
    assert.equal(body.teacher.first_name, 'Alice')
    assert.exists(body.created_at)
  })

  test('student tries to send feedback → 403', async ({ client }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    const enrollment = await enrollStudent(client, teacher.token, student.token, cls.id)

    const response = await sendFeedback(client, student.token, enrollment.id)
    response.assertStatus(403)
  })

  test('non-owner teacher → 403', async ({ client }) => {
    const teacherA = await registerTeacher(client)
    const teacherB = await registerTeacher(client, { email: 'teacher2@example.com' })
    const student = await registerStudent(client)
    const cls = await createClass(client, teacherA.token)
    const enrollment = await enrollStudent(client, teacherA.token, student.token, cls.id)

    const response = await sendFeedback(client, teacherB.token, enrollment.id)
    response.assertStatus(403)
  })

  test('feedback content is encrypted in DB', async ({ client, assert }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    const enrollment = await enrollStudent(client, teacher.token, student.token, cls.id)

    const plaintext = 'Great progress on your guard passing! Keep working on your hip movement.'
    const response = await sendFeedback(client, teacher.token, enrollment.id)
    const feedbackId = response.body().id

    // Query raw DB — content should be encrypted (not plaintext)
    const row = await db.from('feedback').where('id', feedbackId).first()
    assert.notEqual(row.content, plaintext)
    assert.isString(row.content)
  })

  test('audit log written on feedback_sent', async ({ client, assert }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    const enrollment = await enrollStudent(client, teacher.token, student.token, cls.id)

    const response = await sendFeedback(client, teacher.token, enrollment.id)
    const feedbackId = response.body().id

    const log = await AuditLog.query()
      .where('user_id', teacher.user.id)
      .where('action', 'feedback_sent')
      .where('resource_id', feedbackId)
      .first()
    assert.exists(log)
  })
})

// ---------------------------------------------------------------------------
// List feedback (per enrollment)
// ---------------------------------------------------------------------------

test.group('Feedback — List (enrollment)', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('enrolled student sees own feedback', async ({ client, assert }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    const enrollment = await enrollStudent(client, teacher.token, student.token, cls.id)

    await sendFeedback(client, teacher.token, enrollment.id)

    const response = await client
      .get(`/api/v1/enrollments/${enrollment.id}/feedback`)
      .header('Authorization', `Bearer ${student.token}`)

    response.assertStatus(200)
    assert.lengthOf(response.body(), 1)
    assert.equal(response.body()[0].teacher.first_name, 'Alice')
  })

  test('data isolation: Student A cannot see Student B feedback', async ({ client }) => {
    const teacher = await registerTeacher(client)
    const studentA = await registerStudent(client, { email: 'studentA@example.com' })
    const studentB = await registerStudent(client, { email: 'studentB@example.com' })
    const cls = await createClass(client, teacher.token)

    const enrollmentA = await enrollStudent(client, teacher.token, studentA.token, cls.id)
    const enrollmentB = await enrollStudent(client, teacher.token, studentB.token, cls.id)

    await sendFeedback(client, teacher.token, enrollmentA.id, {
      content: 'Feedback for student A, great job on the guard passing!',
    })
    await sendFeedback(client, teacher.token, enrollmentB.id, {
      content: 'Feedback for student B, nice takedown technique!',
    })

    // Student A checks Student B's enrollment feedback → 403
    const response = await client
      .get(`/api/v1/enrollments/${enrollmentB.id}/feedback`)
      .header('Authorization', `Bearer ${studentA.token}`)

    response.assertStatus(403)
  })

  test('teacher can view feedback for their class enrollment', async ({ client, assert }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    const enrollment = await enrollStudent(client, teacher.token, student.token, cls.id)

    await sendFeedback(client, teacher.token, enrollment.id)

    const response = await client
      .get(`/api/v1/enrollments/${enrollment.id}/feedback`)
      .header('Authorization', `Bearer ${teacher.token}`)

    response.assertStatus(200)
    assert.lengthOf(response.body(), 1)
  })
})

// ---------------------------------------------------------------------------
// My feedback (student aggregate)
// ---------------------------------------------------------------------------

test.group('Feedback — My feedback', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('teacher → 403', async ({ client }) => {
    const teacher = await registerTeacher(client)

    const response = await client
      .get('/api/v1/feedback')
      .header('Authorization', `Bearer ${teacher.token}`)

    response.assertStatus(403)
  })

  test('student sees feedback across enrollments', async ({ client, assert }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)

    const cls1 = await createClass(client, teacher.token, { name: 'BJJ Fundamentals' })
    const cls2 = await createClass(client, teacher.token, { name: 'Muay Thai Basics' })

    const enrollment1 = await enrollStudent(client, teacher.token, student.token, cls1.id)
    const enrollment2 = await enrollStudent(client, teacher.token, student.token, cls2.id)

    await sendFeedback(client, teacher.token, enrollment1.id, {
      content: 'Your BJJ technique is improving well!',
    })
    await sendFeedback(client, teacher.token, enrollment2.id, {
      content: 'Your Muay Thai kicks are getting stronger!',
    })

    const response = await client
      .get('/api/v1/feedback')
      .header('Authorization', `Bearer ${student.token}`)

    response.assertStatus(200)
    assert.lengthOf(response.body().data, 2)
    assert.exists(response.body().data[0].class_name)
  })
})

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

test.group('Feedback — Notifications', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('FeedbackSent creates notification for the student', async ({ client, assert }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    const enrollment = await enrollStudent(client, teacher.token, student.token, cls.id)

    await sendFeedback(client, teacher.token, enrollment.id)

    // Allow event listeners to complete
    await new Promise((r) => setTimeout(r, 100))

    const notification = await Notification.query()
      .where('user_id', student.user.id)
      .where('type', 'feedback_received')
      .first()

    assert.exists(notification)
  })
})
