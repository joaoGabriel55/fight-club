import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import AuditLog from '#models/audit_log'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function registerTeacher(
  client: any,
  overrides: Record<string, unknown> = {}
): Promise<{ token: string; user: { id: string; first_name: string; profile_type: string } }> {
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
): Promise<{ token: string; user: { id: string } }> {
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
  return client
    .post('/api/v1/classes')
    .header('Authorization', `Bearer ${token}`)
    .json({
      name: 'Brazilian Jiu-Jitsu',
      martial_art: 'BJJ',
      has_belt_system: true,
      description: 'A grappling art',
      schedules: [{ day_of_week: 1, start_time: '09:00', end_time: '10:00' }],
      ...overrides,
    })
}

// ---------------------------------------------------------------------------
// Create class
// ---------------------------------------------------------------------------

test.group('Classes — Create', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('happy path: 201 with class + schedules', async ({ client, assert }) => {
    const { token } = await registerTeacher(client)
    const response = await createClass(client, token)

    response.assertStatus(201)
    const body = response.body()
    assert.isString(body.id)
    assert.equal(body.name, 'Brazilian Jiu-Jitsu')
    assert.equal(body.martial_art, 'BJJ')
    assert.isTrue(body.has_belt_system)
    assert.isArray(body.schedules)
    assert.lengthOf(body.schedules, 1)
    assert.equal(body.schedules[0].day_of_week, 1)
    // PostgreSQL normalises time values to HH:MM:SS
    assert.isTrue(body.schedules[0].start_time.startsWith('09:00'))
    assert.isTrue(body.schedules[0].end_time.startsWith('10:00'))
  })

  test('response does not include teacher_id', async ({ client, assert }) => {
    const { token } = await registerTeacher(client)
    const response = await createClass(client, token)

    response.assertStatus(201)
    assert.notExists(response.body().teacher_id)
  })

  test('class and schedules are written to DB', async ({ client, assert }) => {
    const { token, user } = await registerTeacher(client)
    const response = await createClass(client, token)

    const classRow = await db.from('classes').where('id', response.body().id).first()
    assert.exists(classRow)
    assert.equal(classRow.teacher_id, user.id)

    const scheduleRows = await db
      .from('class_schedules')
      .where('class_id', response.body().id)
      .select('*')
    assert.lengthOf(scheduleRows, 1)
  })

  test('student token → 403', async ({ client }) => {
    const { token } = await registerStudent(client)
    const response = await createClass(client, token)
    response.assertStatus(403)
  })

  test('no schedules → 422', async ({ client }) => {
    const { token } = await registerTeacher(client)
    const response = await createClass(client, token, { schedules: [] })
    response.assertStatus(422)
  })

  test('invalid day_of_week (7) → 422', async ({ client }) => {
    const { token } = await registerTeacher(client)
    const response = await createClass(client, token, {
      schedules: [{ day_of_week: 7, start_time: '09:00', end_time: '10:00' }],
    })
    response.assertStatus(422)
  })

  test('negative day_of_week → 422', async ({ client }) => {
    const { token } = await registerTeacher(client)
    const response = await createClass(client, token, {
      schedules: [{ day_of_week: -1, start_time: '09:00', end_time: '10:00' }],
    })
    response.assertStatus(422)
  })

  test('end_time before start_time → 422', async ({ client }) => {
    const { token } = await registerTeacher(client)
    const response = await createClass(client, token, {
      schedules: [{ day_of_week: 1, start_time: '10:00', end_time: '09:00' }],
    })
    response.assertStatus(422)
  })

  test('end_time equal to start_time → 422', async ({ client }) => {
    const { token } = await registerTeacher(client)
    const response = await createClass(client, token, {
      schedules: [{ day_of_week: 1, start_time: '09:00', end_time: '09:00' }],
    })
    response.assertStatus(422)
  })

  test('name shorter than 3 chars → 422', async ({ client }) => {
    const { token } = await registerTeacher(client)
    const response = await createClass(client, token, { name: 'AB' })
    response.assertStatus(422)
  })

  test('audit log written on creation', async ({ client, assert }) => {
    const { token, user } = await registerTeacher(client)
    const response = await createClass(client, token)

    const log = await AuditLog.query()
      .where('user_id', user.id)
      .where('action', 'class_created')
      .where('resource_id', response.body().id)
      .first()
    assert.exists(log)
  })

  test('unauthenticated request → 401', async ({ client }) => {
    const response = await client.post('/api/v1/classes').json({
      name: 'Test',
      martial_art: 'BJJ',
      has_belt_system: false,
      schedules: [{ day_of_week: 1, start_time: '09:00', end_time: '10:00' }],
    })
    response.assertStatus(401)
  })
})

// ---------------------------------------------------------------------------
// List classes
// ---------------------------------------------------------------------------

test.group('Classes — List', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('teacher sees only their own classes', async ({ client, assert }) => {
    const teacherA = await registerTeacher(client)
    const teacherB = await registerTeacher(client, { email: 'teacher2@example.com' })

    // Teacher A creates 2 classes
    await createClass(client, teacherA.token)
    await createClass(client, teacherA.token, { name: 'Muay Thai Class' })

    // Teacher B creates 1 class
    await createClass(client, teacherB.token, { name: 'Karate Class' })

    const responseA = await client
      .get('/api/v1/classes')
      .header('Authorization', `Bearer ${teacherA.token}`)
    responseA.assertStatus(200)
    assert.lengthOf(responseA.body(), 2)

    const responseB = await client
      .get('/api/v1/classes')
      .header('Authorization', `Bearer ${teacherB.token}`)
    responseB.assertStatus(200)
    assert.lengthOf(responseB.body(), 1)
  })

  test('soft-deleted class does not appear in list', async ({ client, assert }) => {
    const { token } = await registerTeacher(client)
    const created = await createClass(client, token)
    const classId = created.body().id

    await client.delete(`/api/v1/classes/${classId}`).header('Authorization', `Bearer ${token}`)

    const listResponse = await client
      .get('/api/v1/classes')
      .header('Authorization', `Bearer ${token}`)
    listResponse.assertStatus(200)
    const ids = listResponse.body().map((c: any) => c.id)
    assert.notInclude(ids, classId)
  })

  test('includes schedule_count in list response', async ({ client, assert }) => {
    const { token } = await registerTeacher(client)
    await createClass(client, token, {
      schedules: [
        { day_of_week: 1, start_time: '09:00', end_time: '10:00' },
        { day_of_week: 3, start_time: '11:00', end_time: '12:00' },
      ],
    })

    const listResponse = await client
      .get('/api/v1/classes')
      .header('Authorization', `Bearer ${token}`)
    listResponse.assertStatus(200)
    assert.equal(listResponse.body()[0].schedule_count, 2)
  })

  test('student token → 403', async ({ client }) => {
    const { token } = await registerStudent(client)
    const response = await client.get('/api/v1/classes').header('Authorization', `Bearer ${token}`)
    response.assertStatus(403)
  })
})

// ---------------------------------------------------------------------------
// Get class detail
// ---------------------------------------------------------------------------

test.group('Classes — Get detail', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('owner can get their class', async ({ client, assert }) => {
    const { token } = await registerTeacher(client)
    const created = await createClass(client, token)
    const classId = created.body().id

    const response = await client
      .get(`/api/v1/classes/${classId}`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    assert.equal(response.body().id, classId)
    assert.isArray(response.body().schedules)
  })

  test('non-owner teacher → 403', async ({ client }) => {
    const teacherA = await registerTeacher(client)
    const teacherB = await registerTeacher(client, { email: 'teacher2@example.com' })

    const created = await createClass(client, teacherA.token)
    const classId = created.body().id

    const response = await client
      .get(`/api/v1/classes/${classId}`)
      .header('Authorization', `Bearer ${teacherB.token}`)

    response.assertStatus(403)
  })

  test('student token → 403', async ({ client }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)

    const created = await createClass(client, teacher.token)
    const classId = created.body().id

    const response = await client
      .get(`/api/v1/classes/${classId}`)
      .header('Authorization', `Bearer ${student.token}`)

    response.assertStatus(403)
  })

  test('non-existent class → 404', async ({ client }) => {
    const { token } = await registerTeacher(client)

    const response = await client
      .get('/api/v1/classes/00000000-0000-0000-0000-000000000000')
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(404)
  })
})

// ---------------------------------------------------------------------------
// Update class
// ---------------------------------------------------------------------------

test.group('Classes — Update', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('owner can update their class', async ({ client, assert }) => {
    const { token } = await registerTeacher(client)
    const created = await createClass(client, token)
    const classId = created.body().id

    const response = await client
      .put(`/api/v1/classes/${classId}`)
      .header('Authorization', `Bearer ${token}`)
      .json({ name: 'Updated Name' })

    response.assertStatus(200)
    assert.equal(response.body().name, 'Updated Name')
  })

  test('non-owner → 403', async ({ client }) => {
    const teacherA = await registerTeacher(client)
    const teacherB = await registerTeacher(client, { email: 'teacher2@example.com' })

    const created = await createClass(client, teacherA.token)
    const classId = created.body().id

    const response = await client
      .put(`/api/v1/classes/${classId}`)
      .header('Authorization', `Bearer ${teacherB.token}`)
      .json({ name: 'Hacked Name' })

    response.assertStatus(403)
  })

  test('audit log written on update', async ({ client, assert }) => {
    const { token, user } = await registerTeacher(client)
    const created = await createClass(client, token)
    const classId = created.body().id

    await client
      .put(`/api/v1/classes/${classId}`)
      .header('Authorization', `Bearer ${token}`)
      .json({ name: 'Updated Name' })

    const log = await AuditLog.query()
      .where('user_id', user.id)
      .where('action', 'class_updated')
      .where('resource_id', classId)
      .first()
    assert.exists(log)
  })
})

// ---------------------------------------------------------------------------
// Delete class (soft delete)
// ---------------------------------------------------------------------------

test.group('Classes — Delete (soft)', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('owner can soft-delete their class', async ({ client, assert }) => {
    const { token } = await registerTeacher(client)
    const created = await createClass(client, token)
    const classId = created.body().id

    const response = await client
      .delete(`/api/v1/classes/${classId}`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(204)

    // Row still exists in DB with deleted_at set
    const row = await db.from('classes').where('id', classId).first()
    assert.exists(row)
    assert.exists(row.deleted_at)
  })

  test('class does not appear in GET /classes after deletion', async ({ client, assert }) => {
    const { token } = await registerTeacher(client)
    const created = await createClass(client, token)
    const classId = created.body().id

    await client.delete(`/api/v1/classes/${classId}`).header('Authorization', `Bearer ${token}`)

    const listResponse = await client
      .get('/api/v1/classes')
      .header('Authorization', `Bearer ${token}`)
    const ids = listResponse.body().map((c: any) => c.id)
    assert.notInclude(ids, classId)
  })

  test('non-owner → 403', async ({ client }) => {
    const teacherA = await registerTeacher(client)
    const teacherB = await registerTeacher(client, { email: 'teacher2@example.com' })

    const created = await createClass(client, teacherA.token)
    const classId = created.body().id

    const response = await client
      .delete(`/api/v1/classes/${classId}`)
      .header('Authorization', `Bearer ${teacherB.token}`)

    response.assertStatus(403)
  })

  test('audit log written on delete', async ({ client, assert }) => {
    const { token, user } = await registerTeacher(client)
    const created = await createClass(client, token)
    const classId = created.body().id

    await client.delete(`/api/v1/classes/${classId}`).header('Authorization', `Bearer ${token}`)

    const log = await AuditLog.query()
      .where('user_id', user.id)
      .where('action', 'class_deleted')
      .where('resource_id', classId)
      .first()
    assert.exists(log)
  })
})

// ---------------------------------------------------------------------------
// Student list
// ---------------------------------------------------------------------------

test.group('Classes — Student list', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('owner gets student list (empty until enrollment feature)', async ({ client, assert }) => {
    const { token } = await registerTeacher(client)
    const created = await createClass(client, token)
    const classId = created.body().id

    const response = await client
      .get(`/api/v1/classes/${classId}/students`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    assert.isArray(response.body())
  })

  test('student list response objects do not expose PII fields', async ({ client, assert }) => {
    const { token } = await registerTeacher(client)
    const created = await createClass(client, token)
    const classId = created.body().id

    const response = await client
      .get(`/api/v1/classes/${classId}/students`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    for (const student of response.body()) {
      assert.notExists(student.email)
      assert.notExists(student.last_name)
      assert.notExists(student.birth_date)
      assert.notExists(student.weight_kg)
      assert.notExists(student.height_cm)
    }
  })

  test('non-owner → 403', async ({ client }) => {
    const teacherA = await registerTeacher(client)
    const teacherB = await registerTeacher(client, { email: 'teacher2@example.com' })

    const created = await createClass(client, teacherA.token)
    const classId = created.body().id

    const response = await client
      .get(`/api/v1/classes/${classId}/students`)
      .header('Authorization', `Bearer ${teacherB.token}`)

    response.assertStatus(403)
  })

  test('student token → 403', async ({ client }) => {
    const teacher = await registerTeacher(client)
    const student = await registerStudent(client)

    const created = await createClass(client, teacher.token)
    const classId = created.body().id

    const response = await client
      .get(`/api/v1/classes/${classId}/students`)
      .header('Authorization', `Bearer ${student.token}`)

    response.assertStatus(403)
  })
})

// ---------------------------------------------------------------------------
// Schedule CRUD
// ---------------------------------------------------------------------------

test.group('Schedules — CRUD', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('add schedule → appears in GET /classes/:id', async ({ client, assert }) => {
    const { token } = await registerTeacher(client)
    const created = await createClass(client, token)
    const classId = created.body().id

    const addResponse = await client
      .post(`/api/v1/classes/${classId}/schedules`)
      .header('Authorization', `Bearer ${token}`)
      .json({ day_of_week: 3, start_time: '14:00', end_time: '15:30' })

    addResponse.assertStatus(201)
    const scheduleId = addResponse.body().id

    const detailResponse = await client
      .get(`/api/v1/classes/${classId}`)
      .header('Authorization', `Bearer ${token}`)

    const scheduleIds = detailResponse.body().schedules.map((s: any) => s.id)
    assert.include(scheduleIds, scheduleId)
  })

  test('update schedule day_of_week → reflected', async ({ client, assert }) => {
    const { token } = await registerTeacher(client)
    const created = await createClass(client, token)
    const classId = created.body().id
    const scheduleId = created.body().schedules[0].id

    const updateResponse = await client
      .put(`/api/v1/classes/${classId}/schedules/${scheduleId}`)
      .header('Authorization', `Bearer ${token}`)
      .json({ day_of_week: 5 })

    updateResponse.assertStatus(200)
    assert.equal(updateResponse.body().day_of_week, 5)
  })

  test('delete schedule → gone from class detail', async ({ client, assert }) => {
    const { token } = await registerTeacher(client)
    const created = await createClass(client, token)
    const classId = created.body().id
    const scheduleId = created.body().schedules[0].id

    const deleteResponse = await client
      .delete(`/api/v1/classes/${classId}/schedules/${scheduleId}`)
      .header('Authorization', `Bearer ${token}`)
    deleteResponse.assertStatus(204)

    const detailResponse = await client
      .get(`/api/v1/classes/${classId}`)
      .header('Authorization', `Bearer ${token}`)
    const scheduleIds = detailResponse.body().schedules.map((s: any) => s.id)
    assert.notInclude(scheduleIds, scheduleId)
  })

  test('add schedule with end_time before start_time → 422', async ({ client }) => {
    const { token } = await registerTeacher(client)
    const created = await createClass(client, token)
    const classId = created.body().id

    const response = await client
      .post(`/api/v1/classes/${classId}/schedules`)
      .header('Authorization', `Bearer ${token}`)
      .json({ day_of_week: 2, start_time: '12:00', end_time: '10:00' })

    response.assertStatus(422)
  })

  test('add schedule with invalid day_of_week (8) → 422', async ({ client }) => {
    const { token } = await registerTeacher(client)
    const created = await createClass(client, token)
    const classId = created.body().id

    const response = await client
      .post(`/api/v1/classes/${classId}/schedules`)
      .header('Authorization', `Bearer ${token}`)
      .json({ day_of_week: 8, start_time: '09:00', end_time: '10:00' })

    response.assertStatus(422)
  })

  test('non-owner cannot add schedule → 403', async ({ client }) => {
    const teacherA = await registerTeacher(client)
    const teacherB = await registerTeacher(client, { email: 'teacher2@example.com' })

    const created = await createClass(client, teacherA.token)
    const classId = created.body().id

    const response = await client
      .post(`/api/v1/classes/${classId}/schedules`)
      .header('Authorization', `Bearer ${teacherB.token}`)
      .json({ day_of_week: 2, start_time: '09:00', end_time: '10:00' })

    response.assertStatus(403)
  })
})
