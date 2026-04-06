import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import AuditLog from '#models/audit_log'
import { AiService } from '#services/ai_service'

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
    birth_date: '2000-05-15',
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
  const response = await client
    .post(`/api/v1/enrollments/${enrollmentId}/feedback`)
    .header('Authorization', `Bearer ${token}`)
    .json({
      content: 'Great progress on your guard passing! Keep working on your hip movement.',
      ...overrides,
    })
  return response
}

// ---------------------------------------------------------------------------
// AI Improvement Tips
// ---------------------------------------------------------------------------

test.group('AI — Improvement Tips', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('happy path: student requests tips → 200 + tips string', async ({ client, assert }) => {
    const originalGenerateTips = AiService.generateTips
    AiService.generateTips = async () => '1. Practice your guard passes\n2. Work on hip escapes'

    try {
      const teacher = await registerTeacher(client)
      const student = await registerStudent(client)
      const cls = await createClass(client, teacher.token)
      const enrollment = await enrollStudent(client, teacher.token, student.token, cls.id)

      const feedbackResp = await sendFeedback(client, teacher.token, enrollment.id)
      const feedbackId = feedbackResp.body().id

      const response = await client
        .post('/api/v1/ai/improvement-tips')
        .header('Authorization', `Bearer ${student.token}`)
        .json({ feedback_id: feedbackId, focus_area: 'Ground game' })

      response.assertStatus(200)
      const body = response.body()
      assert.isString(body.tips)
      assert.isAbove(body.tips.length, 0)
    } finally {
      AiService.generateTips = originalGenerateTips
    }
  }).timeout(30000)

  test('teacher calls endpoint → 403', async ({ client }) => {
    const teacher = await registerTeacher(client)

    const response = await client
      .post('/api/v1/ai/improvement-tips')
      .header('Authorization', `Bearer ${teacher.token}`)
      .json({ feedback_id: '00000000-0000-0000-0000-000000000000' })

    response.assertStatus(403)
  })

  test('wrong student (Student B tries Student A feedback) → 403', async ({ client }) => {
    const teacher = await registerTeacher(client)
    const studentA = await registerStudent(client, { email: 'studentA@example.com' })
    const studentB = await registerStudent(client, { email: 'studentB@example.com' })
    const cls = await createClass(client, teacher.token)

    const enrollmentA = await enrollStudent(client, teacher.token, studentA.token, cls.id)
    await enrollStudent(client, teacher.token, studentB.token, cls.id)

    const feedbackResp = await sendFeedback(client, teacher.token, enrollmentA.id)
    const feedbackId = feedbackResp.body().id

    const response = await client
      .post('/api/v1/ai/improvement-tips')
      .header('Authorization', `Bearer ${studentB.token}`)
      .json({ feedback_id: feedbackId })

    response.assertStatus(403)
  })

  test('invalid focus_area → 422', async ({ client }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    const enrollment = await enrollStudent(client, teacher.token, student.token, cls.id)

    const feedbackResp = await sendFeedback(client, teacher.token, enrollment.id)
    const feedbackId = feedbackResp.body().id

    const response = await client
      .post('/api/v1/ai/improvement-tips')
      .header('Authorization', `Bearer ${student.token}`)
      .json({ feedback_id: feedbackId, focus_area: 'Invalid Area' })

    response.assertStatus(422)
  })

  test('invalid feedback_id (random UUID) → 404', async ({ client }) => {
    const student = await registerStudent(client)

    const response = await client
      .post('/api/v1/ai/improvement-tips')
      .header('Authorization', `Bearer ${student.token}`)
      .json({ feedback_id: '00000000-0000-0000-0000-000000000000' })

    response.assertStatus(404)
  })

  test('audit log written on ai_tips_requested', async ({ client, assert }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    const enrollment = await enrollStudent(client, teacher.token, student.token, cls.id)

    const feedbackResp = await sendFeedback(client, teacher.token, enrollment.id)
    const feedbackId = feedbackResp.body().id

    await client
      .post('/api/v1/ai/improvement-tips')
      .header('Authorization', `Bearer ${student.token}`)
      .json({ feedback_id: feedbackId })

    const log = await AuditLog.query()
      .where('user_id', student.user.id)
      .where('action', 'ai_tips_requested')
      .first()
    assert.exists(log)
  }).timeout(30000)
})

// ---------------------------------------------------------------------------
// AI Class Tips ("What Teach Today")
// ---------------------------------------------------------------------------

test.group('AI — Class Tips', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('happy path: teacher requests class tips → 200 + tips string', async ({
    client,
    assert,
  }) => {
    const originalGenerateTips = AiService.generateTips
    AiService.generateTips = async () => '## Drill 1\n- Shadow boxing\n\n## Drill 2\n- Pad work'

    try {
      const teacher = await registerTeacher(client)
      const student = await registerStudent(client)
      const cls = await createClass(client, teacher.token, {
        martial_art: 'Muay Thai',
        name: 'Muay Thai Basics',
      })
      await enrollStudent(client, teacher.token, student.token, cls.id)

      const response = await client
        .post('/api/v1/ai/class-tips')
        .header('Authorization', `Bearer ${teacher.token}`)
        .json({ class_id: cls.id, focus_area: 'Striking technique' })

      response.assertStatus(200)
      const body = response.body()
      assert.isString(body.tips)
      assert.isAbove(body.tips.length, 0)
    } finally {
      AiService.generateTips = originalGenerateTips
    }
  }).timeout(30000)

  test('student calls endpoint → 403', async ({ client }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)

    const response = await client
      .post('/api/v1/ai/class-tips')
      .header('Authorization', `Bearer ${student.token}`)
      .json({ class_id: cls.id })

    response.assertStatus(403)
  })

  test('teacher requests tips for class they do not own → 404', async ({ client }) => {
    const teacher1 = await registerTeacher(client, { email: 'teacher1@example.com' })
    const teacher2 = await registerTeacher(client, { email: 'teacher2@example.com' })
    const cls = await createClass(client, teacher1.token)

    const response = await client
      .post('/api/v1/ai/class-tips')
      .header('Authorization', `Bearer ${teacher2.token}`)
      .json({ class_id: cls.id })

    response.assertStatus(404)
  })

  test('class with no students → 422', async ({ client }) => {
    const teacher = await registerTeacher(client)
    const cls = await createClass(client, teacher.token)

    const response = await client
      .post('/api/v1/ai/class-tips')
      .header('Authorization', `Bearer ${teacher.token}`)
      .json({ class_id: cls.id })

    response.assertStatus(422)
  })

  test('invalid class_id (random UUID) → 404', async ({ client }) => {
    const teacher = await registerTeacher(client)

    const response = await client
      .post('/api/v1/ai/class-tips')
      .header('Authorization', `Bearer ${teacher.token}`)
      .json({ class_id: '00000000-0000-0000-0000-000000000000' })

    response.assertStatus(404)
  })

  test('invalid focus_area → 422', async ({ client }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)
    const cls = await createClass(client, teacher.token)
    await enrollStudent(client, teacher.token, student.token, cls.id)

    const response = await client
      .post('/api/v1/ai/class-tips')
      .header('Authorization', `Bearer ${teacher.token}`)
      .json({ class_id: cls.id, focus_area: 'Invalid Area' })

    response.assertStatus(422)
  })

  test('audit log written on ai_class_tips_requested', async ({ client, assert }) => {
    const originalGenerateTips = AiService.generateTips
    AiService.generateTips = async () => 'Test tips'

    try {
      const teacher = await registerTeacher(client)
      const student = await registerStudent(client)
      const cls = await createClass(client, teacher.token)
      await enrollStudent(client, teacher.token, student.token, cls.id)

      await client
        .post('/api/v1/ai/class-tips')
        .header('Authorization', `Bearer ${teacher.token}`)
        .json({ class_id: cls.id })

      const log = await AuditLog.query()
        .where('user_id', teacher.user.id)
        .where('action', 'ai_class_tips_requested')
        .first()
      assert.exists(log)
    } finally {
      AiService.generateTips = originalGenerateTips
    }
  }).timeout(30000)
})
