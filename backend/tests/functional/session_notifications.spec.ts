import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import NotifyClassStartReminderJob from '#jobs/notify_class_start_reminder_job'
import NotifySessionReviewJob from '#jobs/notify_session_review_job'
import Notification from '#models/notification'

const TEST_DATE = DateTime.fromObject({
  year: 2026,
  month: 4,
  day: 6,
  hour: 10,
  minute: 0,
})

async function createTeacher(client: any, overrides: Record<string, unknown> = {}) {
  const response = await client.post('/api/v1/auth/register').json({
    email: 'teacher-job-test@example.com',
    password: 'password123',
    first_name: 'Teacher',
    profile_type: 'teacher',
    birth_date: '1980-01-01',
    ...overrides,
  })
  return response.body()
}

async function createStudent(client: any, overrides: Record<string, unknown> = {}) {
  const response = await client.post('/api/v1/auth/register').json({
    email: 'student-job-test@example.com',
    password: 'password123',
    first_name: 'Student',
    profile_type: 'student',
    birth_date: '2000-01-01',
    ...overrides,
  })
  return response.body()
}

async function createClassWithSchedule(
  client: any,
  token: string,
  schedule: Record<string, unknown>
) {
  const response = await client
    .post('/api/v1/classes')
    .header('Authorization', `Bearer ${token}`)
    .json({
      name: 'Test Class',
      martial_art: 'BJJ',
      has_belt_system: true,
      schedules: [schedule],
    })
  return response.body()
}

async function createInvitation(client: any, token: string, classId: string) {
  const response = await client
    .post(`/api/v1/classes/${classId}/invitations`)
    .header('Authorization', `Bearer ${token}`)
    .json({
      expires_at: TEST_DATE.plus({ days: 7 }).toISO(),
    })
  return response.body()
}

async function joinClass(client: any, token: string, invToken: string) {
  return client
    .post(`/api/v1/join/${invToken}`)
    .header('Authorization', `Bearer ${token}`)
    .json({ consent: true })
}

test.group('NotifyClassStartReminderJob', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('sends notification when class starts within 1 hour', async ({ client, assert }) => {
    const teacher = await createTeacher(client)
    const student = await createStudent(client)

    const cls = await createClassWithSchedule(client, teacher.token, {
      day_of_week: 1,
      start_time: '10:30',
      end_time: '11:30',
    })

    const invResp = await createInvitation(client, teacher.token, cls.id)
    await joinClass(client, student.token, invResp.token)

    const job = new NotifyClassStartReminderJob()
    const count = await job.run(TEST_DATE)

    assert.equal(count, 1)

    const notifications = await Notification.query().where('user_id', student.user.id)
    assert.lengthOf(notifications, 1)
    assert.equal(notifications[0].type, 'class_starting_soon')
    assert.include(notifications[0].title, 'Class starting soon')
  })

  test('does not send notification when class is more than 1 hour away', async ({
    client,
    assert,
  }) => {
    const teacher = await createTeacher(client)
    const student = await createStudent(client)

    const cls = await createClassWithSchedule(client, teacher.token, {
      day_of_week: 1,
      start_time: '12:00',
      end_time: '13:00',
    })

    const invResp = await createInvitation(client, teacher.token, cls.id)
    await joinClass(client, student.token, invResp.token)

    const job = new NotifyClassStartReminderJob()
    const count = await job.run(TEST_DATE)

    assert.equal(count, 0)

    const notifications = await Notification.query().where('user_id', student.user.id)
    assert.lengthOf(notifications, 0)
  })

  test('does not send duplicate notification for same session', async ({ client, assert }) => {
    const teacher = await createTeacher(client)
    const student = await createStudent(client)

    const cls = await createClassWithSchedule(client, teacher.token, {
      day_of_week: 1,
      start_time: '10:15',
      end_time: '11:15',
    })

    const invResp = await createInvitation(client, teacher.token, cls.id)
    await joinClass(client, student.token, invResp.token)

    const job = new NotifyClassStartReminderJob()
    await job.run(TEST_DATE)
    const count = await job.run(TEST_DATE)

    assert.equal(count, 0)

    const notifications = await Notification.query().where('user_id', student.user.id)
    assert.lengthOf(notifications, 1)
  })

  test('does not send notification for class on different day', async ({ client, assert }) => {
    const teacher = await createTeacher(client)
    const student = await createStudent(client)

    const cls = await createClassWithSchedule(client, teacher.token, {
      day_of_week: 3,
      start_time: '10:00',
      end_time: '11:00',
    })

    const invResp = await createInvitation(client, teacher.token, cls.id)
    await joinClass(client, student.token, invResp.token)

    const job = new NotifyClassStartReminderJob()
    const count = await job.run(TEST_DATE)

    assert.equal(count, 0)

    const notifications = await Notification.query().where('user_id', student.user.id)
    assert.lengthOf(notifications, 0)
  })
})

test.group('NotifySessionReviewJob', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('sends notification for yesterday session not yet reviewed', async ({ client, assert }) => {
    const teacher = await createTeacher(client)
    const student = await createStudent(client)

    const cls = await createClassWithSchedule(client, teacher.token, {
      day_of_week: 0,
      start_time: '09:00',
      end_time: '10:00',
    })

    const invResp = await createInvitation(client, teacher.token, cls.id)
    await joinClass(client, student.token, invResp.token)

    const job = new NotifySessionReviewJob()
    const count = await job.run(TEST_DATE)

    assert.equal(count, 1)

    const notifications = await Notification.query().where('user_id', student.user.id)
    assert.lengthOf(notifications, 1)
    assert.equal(notifications[0].type, 'class_session_ended')
    assert.include(notifications[0].title, 'Rate your class')
  })

  test('does not send notification when session already reviewed', async ({ client, assert }) => {
    const teacher = await createTeacher(client)
    const student = await createStudent(client)

    const yesterday = DateTime.fromObject({
      year: 2026,
      month: 4,
      day: 5,
    })

    const cls = await createClassWithSchedule(client, teacher.token, {
      day_of_week: 0,
      start_time: '09:00',
      end_time: '10:00',
    })

    const invResp = await createInvitation(client, teacher.token, cls.id)
    await joinClass(client, student.token, invResp.token)

    const reviewModule = await import('#models/review')
    const Review = reviewModule.default
    await Review.create({
      classId: cls.id,
      studentId: student.user.id,
      rating: 4,
      comment: 'Great class!',
      sessionDate: yesterday,
    })

    const job = new NotifySessionReviewJob()
    const count = await job.run(TEST_DATE)

    assert.equal(count, 0)

    const notifications = await Notification.query().where('user_id', student.user.id)
    assert.lengthOf(notifications, 0)
  })

  test('does not send duplicate notification for same session', async ({ client, assert }) => {
    const teacher = await createTeacher(client)
    const student = await createStudent(client)

    const cls = await createClassWithSchedule(client, teacher.token, {
      day_of_week: 0,
      start_time: '09:00',
      end_time: '10:00',
    })

    const invResp = await createInvitation(client, teacher.token, cls.id)
    await joinClass(client, student.token, invResp.token)

    const job = new NotifySessionReviewJob()
    await job.run(TEST_DATE)
    const count = await job.run(TEST_DATE)

    assert.equal(count, 0)

    const notifications = await Notification.query().where('user_id', student.user.id)
    assert.lengthOf(notifications, 1)
  })

  test('does not send notification for class on different day', async ({ client, assert }) => {
    const teacher = await createTeacher(client)
    const student = await createStudent(client)

    const cls = await createClassWithSchedule(client, teacher.token, {
      day_of_week: 3,
      start_time: '09:00',
      end_time: '10:00',
    })

    const invResp = await createInvitation(client, teacher.token, cls.id)
    await joinClass(client, student.token, invResp.token)

    const job = new NotifySessionReviewJob()
    const count = await job.run(TEST_DATE)

    assert.equal(count, 0)

    const notifications = await Notification.query().where('user_id', student.user.id)
    assert.lengthOf(notifications, 0)
  })
})
