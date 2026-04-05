import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import { UserFactory, ClassFactory, EnrollmentFactory } from '#database/factories/index'
import FeedbackPolicy from '#policies/feedback_policy'

test.group('FeedbackPolicy', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('teacher who owns the class can create feedback', async ({ assert }) => {
    const teacher = await UserFactory.apply('teacher').create()
    const student = await UserFactory.apply('student').create()
    const cls = await ClassFactory.merge({ teacherId: teacher.id }).create()
    const enrollment = await EnrollmentFactory.merge({
      classId: cls.id,
      studentId: student.id,
    }).create()

    const allowed = await FeedbackPolicy.create(teacher, enrollment)

    assert.isTrue(allowed)
  })

  test('teacher who does not own the class cannot create feedback', async ({ assert }) => {
    const teacher1 = await UserFactory.apply('teacher').create()
    const teacher2 = await UserFactory.apply('teacher').create()
    const student = await UserFactory.apply('student').create()
    const cls = await ClassFactory.merge({ teacherId: teacher1.id }).create()
    const enrollment = await EnrollmentFactory.merge({
      classId: cls.id,
      studentId: student.id,
    }).create()

    const allowed = await FeedbackPolicy.create(teacher2, enrollment)

    assert.isFalse(allowed)
  })

  test('student cannot create feedback', async ({ assert }) => {
    const teacher = await UserFactory.apply('teacher').create()
    const student = await UserFactory.apply('student').create()
    const cls = await ClassFactory.merge({ teacherId: teacher.id }).create()
    const enrollment = await EnrollmentFactory.merge({
      classId: cls.id,
      studentId: student.id,
    }).create()

    const allowed = await FeedbackPolicy.create(student, enrollment)

    assert.isFalse(allowed)
  })

  test('enrolled student can view their feedback', async ({ assert }) => {
    const teacher = await UserFactory.apply('teacher').create()
    const student = await UserFactory.apply('student').create()
    const cls = await ClassFactory.merge({ teacherId: teacher.id }).create()
    const enrollment = await EnrollmentFactory.merge({
      classId: cls.id,
      studentId: student.id,
    }).create()

    const allowed = await FeedbackPolicy.view(student, enrollment)

    assert.isTrue(allowed)
  })

  test('non-enrolled student cannot view feedback', async ({ assert }) => {
    const teacher = await UserFactory.apply('teacher').create()
    const student1 = await UserFactory.apply('student').create()
    const student2 = await UserFactory.apply('student').create()
    const cls = await ClassFactory.merge({ teacherId: teacher.id }).create()
    const enrollment = await EnrollmentFactory.merge({
      classId: cls.id,
      studentId: student1.id,
    }).create()

    // student2 is not the enrolled student and is not a teacher
    const allowed = await FeedbackPolicy.view(student2, enrollment)

    assert.isFalse(allowed)
  })

  test('teacher who owns the class can view feedback', async ({ assert }) => {
    const teacher = await UserFactory.apply('teacher').create()
    const student = await UserFactory.apply('student').create()
    const cls = await ClassFactory.merge({ teacherId: teacher.id }).create()
    const enrollment = await EnrollmentFactory.merge({
      classId: cls.id,
      studentId: student.id,
    }).create()

    const allowed = await FeedbackPolicy.view(teacher, enrollment)

    assert.isTrue(allowed)
  })

  test('teacher who does not own the class cannot view feedback', async ({ assert }) => {
    const teacher1 = await UserFactory.apply('teacher').create()
    const teacher2 = await UserFactory.apply('teacher').create()
    const student = await UserFactory.apply('student').create()
    const cls = await ClassFactory.merge({ teacherId: teacher1.id }).create()
    const enrollment = await EnrollmentFactory.merge({
      classId: cls.id,
      studentId: student.id,
    }).create()

    const allowed = await FeedbackPolicy.view(teacher2, enrollment)

    assert.isFalse(allowed)
  })
})
