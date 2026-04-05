import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function registerTeacher(
  client: any,
  overrides: Record<string, unknown> = {}
): Promise<{ token: string; user: { id: string; first_name: string; profile_type: string } }> {
  const response = await client.post('/api/v1/auth/register').json({
    email: `teacher-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    password: 'Password123!',
    first_name: 'Teacher',
    profile_type: 'teacher',
    birth_date: '1990-01-01',
    ...overrides,
  })
  return response.body()
}

async function registerStudent(
  client: any,
  overrides: Record<string, unknown> = {}
): Promise<{ token: string; user: { id: string; first_name: string; profile_type: string } }> {
  const response = await client.post('/api/v1/auth/register').json({
    email: `student-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    password: 'Password123!',
    first_name: 'Student',
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
      name: 'Test Dojo',
      martial_art: 'BJJ',
      has_belt_system: true,
      description: 'Test class',
      schedules: [{ day_of_week: 1, start_time: '09:00', end_time: '10:00' }],
      ...overrides,
    })
  return response.body()
}

async function createInvitationAndEnroll(
  client: any,
  teacherToken: string,
  studentToken: string,
  classId: string
) {
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + 7)

  const invResponse = await client
    .post(`/api/v1/classes/${classId}/invitations`)
    .header('Authorization', `Bearer ${teacherToken}`)
    .json({ expires_at: futureDate.toISOString() })

  const invToken = invResponse.body().token

  const enrollResponse = await client
    .post(`/api/v1/join/${invToken}`)
    .header('Authorization', `Bearer ${studentToken}`)
    .json({ consent: true })

  return enrollResponse.body()
}

// ---------------------------------------------------------------------------
// Data Isolation Tests
// ---------------------------------------------------------------------------

test.group('Privacy — Data Isolation: Teacher classes', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('Teacher A cannot see Teacher B classes via GET /classes', async ({ client, assert }) => {
    const teacherA = await registerTeacher(client, { email: 'teacherA@isolation.com' })
    const teacherB = await registerTeacher(client, { email: 'teacherB@isolation.com' })

    // Teacher A creates a class
    await createClass(client, teacherA.token, { name: 'Teacher A Dojo' })

    // Teacher B creates a class
    await createClass(client, teacherB.token, { name: 'Teacher B Dojo' })

    // Teacher B lists classes — should only see their own
    const response = await client
      .get('/api/v1/classes')
      .header('Authorization', `Bearer ${teacherB.token}`)

    response.assertStatus(200)
    const body = response.body()
    const classes = body.data || body
    assert.isArray(classes)
    assert.lengthOf(classes, 1)
    assert.equal(classes[0].name, 'Teacher B Dojo')
  })

  test('Teacher A cannot see Teacher B students', async ({ client }) => {
    const teacherA = await registerTeacher(client, { email: 'teacherA2@isolation.com' })
    const teacherB = await registerTeacher(client, { email: 'teacherB2@isolation.com' })
    const student = await registerStudent(client, { email: 'student-iso@isolation.com' })

    // Teacher B creates class and enrolls student
    const cls = await createClass(client, teacherB.token, { name: 'B Class' })
    await createInvitationAndEnroll(client, teacherB.token, student.token, cls.id)

    // Teacher A tries to see Teacher B's class students
    const response = await client
      .get(`/api/v1/classes/${cls.id}/students`)
      .header('Authorization', `Bearer ${teacherA.token}`)

    response.assertStatus(403)
  })
})

test.group('Privacy — Data Isolation: Student feedback', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('Student A cannot see Student B feedback', async ({ client }) => {
    const teacher = await registerTeacher(client, { email: 'teacher-fb@isolation.com' })
    const studentA = await registerStudent(client, { email: 'studentA-fb@isolation.com' })
    const studentB = await registerStudent(client, { email: 'studentB-fb@isolation.com' })

    const cls = await createClass(client, teacher.token, { name: 'Feedback Class' })

    // Enroll student A
    const enrollmentA = await createInvitationAndEnroll(
      client,
      teacher.token,
      studentA.token,
      cls.id
    )

    // Revoke first invitation, then create a new one for student B
    // We need a new invitation because only one active invitation per class
    // First, get invitations list to find the active one
    const invListResp = await client
      .get(`/api/v1/classes/${cls.id}/invitations`)
      .header('Authorization', `Bearer ${teacher.token}`)
    const invitations = invListResp.body()
    if (invitations.length > 0) {
      await client
        .delete(`/api/v1/invitations/${invitations[0].id}`)
        .header('Authorization', `Bearer ${teacher.token}`)
    }

    // Enroll student B
    const enrollB = await createInvitationAndEnroll(client, teacher.token, studentB.token, cls.id)

    // Teacher sends feedback to student A
    await client
      .post(`/api/v1/enrollments/${enrollmentA.id}/feedback`)
      .header('Authorization', `Bearer ${teacher.token}`)
      .json({ content: 'Secret feedback for A only' })

    // Teacher sends feedback to student B
    await client
      .post(`/api/v1/enrollments/${enrollB.id}/feedback`)
      .header('Authorization', `Bearer ${teacher.token}`)
      .json({ content: 'Secret feedback for B only' })

    // Student A reads their own feedback — should work
    const feedbackAResp = await client
      .get(`/api/v1/enrollments/${enrollmentA.id}/feedback`)
      .header('Authorization', `Bearer ${studentA.token}`)
    feedbackAResp.assertStatus(200)

    // Student A tries to read Student B feedback — should be 403
    const feedbackBResp = await client
      .get(`/api/v1/enrollments/${enrollB.id}/feedback`)
      .header('Authorization', `Bearer ${studentA.token}`)
    feedbackBResp.assertStatus(403)
  })
})

test.group('Privacy — Data Isolation: Student belt history', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('Student A cannot see Student B belt history', async ({ client }) => {
    const teacher = await registerTeacher(client, { email: 'teacher-belt@isolation.com' })
    const studentA = await registerStudent(client, { email: 'studentA-belt@isolation.com' })
    const studentB = await registerStudent(client, { email: 'studentB-belt@isolation.com' })

    const cls = await createClass(client, teacher.token, {
      name: 'Belt Class',
      has_belt_system: true,
    })

    // Enroll student A
    await createInvitationAndEnroll(client, teacher.token, studentA.token, cls.id)

    // Revoke and create new invitation for student B
    const invListResp = await client
      .get(`/api/v1/classes/${cls.id}/invitations`)
      .header('Authorization', `Bearer ${teacher.token}`)
    const invitations = invListResp.body()
    if (invitations.length > 0) {
      await client
        .delete(`/api/v1/invitations/${invitations[0].id}`)
        .header('Authorization', `Bearer ${teacher.token}`)
    }

    const enrollB = await createInvitationAndEnroll(client, teacher.token, studentB.token, cls.id)

    // Award belt to student B
    await client
      .post(`/api/v1/enrollments/${enrollB.id}/belts`)
      .header('Authorization', `Bearer ${teacher.token}`)
      .json({ belt_name: 'Yellow', awarded_at: new Date().toISOString() })

    // Student A tries to read Student B belt history — 403
    const beltResp = await client
      .get(`/api/v1/enrollments/${enrollB.id}/belts`)
      .header('Authorization', `Bearer ${studentA.token}`)
    beltResp.assertStatus(403)
  })
})

test.group('Privacy — Data Isolation: Student enrollments', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('Student A cannot see Student B enrollments', async ({ client, assert }) => {
    const teacher = await registerTeacher(client, { email: 'teacher-enr@isolation.com' })
    const studentA = await registerStudent(client, { email: 'studentA-enr@isolation.com' })
    const studentB = await registerStudent(client, { email: 'studentB-enr@isolation.com' })

    const cls = await createClass(client, teacher.token, { name: 'Enrollment Class' })

    // Enroll student B only
    await createInvitationAndEnroll(client, teacher.token, studentB.token, cls.id)

    // Student A lists their enrollments — should be empty (not enrolled anywhere)
    const response = await client
      .get('/api/v1/enrollments')
      .header('Authorization', `Bearer ${studentA.token}`)

    response.assertStatus(200)
    const enrollments = response.body()
    assert.isArray(enrollments)
    assert.lengthOf(enrollments, 0)
  })
})

test.group('Privacy — Data Isolation: Teacher cannot see others students', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('Teacher cannot see students of classes they do not own', async ({ client }) => {
    const teacherA = await registerTeacher(client, { email: 'teacherA-own@isolation.com' })
    const teacherB = await registerTeacher(client, { email: 'teacherB-own@isolation.com' })
    const student = await registerStudent(client, { email: 'student-own@isolation.com' })

    // Teacher A creates a class and enrolls a student
    const cls = await createClass(client, teacherA.token, { name: 'A Class' })
    await createInvitationAndEnroll(client, teacherA.token, student.token, cls.id)

    // Teacher B tries to access Teacher A's students
    const response = await client
      .get(`/api/v1/classes/${cls.id}/students`)
      .header('Authorization', `Bearer ${teacherB.token}`)

    response.assertStatus(403)
  })
})

test.group('Privacy — Data Isolation: Cross-class announcement isolation', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('Student enrolled in Class A cannot see announcements of Class B', async ({
    client,
    assert,
  }) => {
    const teacher = await registerTeacher(client, { email: 'teacher-ann@isolation.com' })
    const student = await registerStudent(client, { email: 'student-ann@isolation.com' })

    // Create two classes
    const classA = await createClass(client, teacher.token, { name: 'Announcement Class A' })

    // Enroll student in class A only
    await createInvitationAndEnroll(client, teacher.token, student.token, classA.id)

    // Revoke invitation for class A before creating class B
    const invListResp = await client
      .get(`/api/v1/classes/${classA.id}/invitations`)
      .header('Authorization', `Bearer ${teacher.token}`)
    const invitations = invListResp.body()
    if (invitations.length > 0) {
      await client
        .delete(`/api/v1/invitations/${invitations[0].id}`)
        .header('Authorization', `Bearer ${teacher.token}`)
    }

    const classB = await createClass(client, teacher.token, { name: 'Announcement Class B' })

    // Create announcement in class B
    await client
      .post(`/api/v1/classes/${classB.id}/announcements`)
      .header('Authorization', `Bearer ${teacher.token}`)
      .json({ title: 'Secret B announcement', content: 'For class B only' })

    // Student tries to access class B announcements directly — should be 403
    const response = await client
      .get(`/api/v1/classes/${classB.id}/announcements`)
      .header('Authorization', `Bearer ${student.token}`)

    response.assertStatus(403)

    // Student's aggregate announcements should not contain class B announcements
    const myAnnouncementsResp = await client
      .get('/api/v1/announcements')
      .header('Authorization', `Bearer ${student.token}`)

    myAnnouncementsResp.assertStatus(200)
    const body = myAnnouncementsResp.body()
    const announcements = body.data || body
    const classBItems = announcements.filter(
      (a: any) => a.class_id === classB.id || a.title === 'Secret B announcement'
    )
    assert.lengthOf(classBItems, 0)
  })
})
