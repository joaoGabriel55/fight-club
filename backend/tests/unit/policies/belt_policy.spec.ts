import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import { UserFactory, ClassFactory, EnrollmentFactory } from '#database/factories/index'
import BeltPolicy from '#policies/belt_policy'

test.group('BeltPolicy', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('teacher who owns class with belt system can award belt', async ({ assert }) => {
    const teacher = await UserFactory.apply('teacher').create()
    const student = await UserFactory.apply('student').create()
    const cls = await ClassFactory.apply('withBeltSystem').merge({ teacherId: teacher.id }).create()
    const enrollment = await EnrollmentFactory.merge({
      classId: cls.id,
      studentId: student.id,
    }).create()

    const allowed = await BeltPolicy.award(teacher, enrollment)

    assert.isTrue(allowed)
  })

  test('teacher who owns class WITHOUT belt system cannot award belt', async ({ assert }) => {
    const teacher = await UserFactory.apply('teacher').create()
    const student = await UserFactory.apply('student').create()
    const cls = await ClassFactory.apply('withoutBeltSystem')
      .merge({ teacherId: teacher.id })
      .create()
    const enrollment = await EnrollmentFactory.merge({
      classId: cls.id,
      studentId: student.id,
    }).create()

    const allowed = await BeltPolicy.award(teacher, enrollment)

    assert.isFalse(allowed)
  })

  test('teacher who does not own the class cannot award belt', async ({ assert }) => {
    const teacher1 = await UserFactory.apply('teacher').create()
    const teacher2 = await UserFactory.apply('teacher').create()
    const student = await UserFactory.apply('student').create()
    const cls = await ClassFactory.apply('withBeltSystem')
      .merge({ teacherId: teacher1.id })
      .create()
    const enrollment = await EnrollmentFactory.merge({
      classId: cls.id,
      studentId: student.id,
    }).create()

    const allowed = await BeltPolicy.award(teacher2, enrollment)

    assert.isFalse(allowed)
  })

  test('student cannot award belt', async ({ assert }) => {
    const teacher = await UserFactory.apply('teacher').create()
    const student = await UserFactory.apply('student').create()
    const cls = await ClassFactory.apply('withBeltSystem').merge({ teacherId: teacher.id }).create()
    const enrollment = await EnrollmentFactory.merge({
      classId: cls.id,
      studentId: student.id,
    }).create()

    const allowed = await BeltPolicy.award(student, enrollment)

    assert.isFalse(allowed)
  })

  test('enrolled student can view belt history', async ({ assert }) => {
    const teacher = await UserFactory.apply('teacher').create()
    const student = await UserFactory.apply('student').create()
    const cls = await ClassFactory.apply('withBeltSystem').merge({ teacherId: teacher.id }).create()
    const enrollment = await EnrollmentFactory.merge({
      classId: cls.id,
      studentId: student.id,
    }).create()

    const allowed = await BeltPolicy.view(student, enrollment)

    assert.isTrue(allowed)
  })

  test('non-enrolled student cannot view belt history', async ({ assert }) => {
    const teacher = await UserFactory.apply('teacher').create()
    const student1 = await UserFactory.apply('student').create()
    const student2 = await UserFactory.apply('student').create()
    const cls = await ClassFactory.apply('withBeltSystem').merge({ teacherId: teacher.id }).create()
    const enrollment = await EnrollmentFactory.merge({
      classId: cls.id,
      studentId: student1.id,
    }).create()

    // student2 is not the enrolled student and not a teacher
    const allowed = await BeltPolicy.view(student2, enrollment)

    assert.isFalse(allowed)
  })

  test('teacher who owns the class can view belt history', async ({ assert }) => {
    const teacher = await UserFactory.apply('teacher').create()
    const student = await UserFactory.apply('student').create()
    const cls = await ClassFactory.apply('withBeltSystem').merge({ teacherId: teacher.id }).create()
    const enrollment = await EnrollmentFactory.merge({
      classId: cls.id,
      studentId: student.id,
    }).create()

    const allowed = await BeltPolicy.view(teacher, enrollment)

    assert.isTrue(allowed)
  })

  test('teacher who does not own the class cannot view belt history', async ({ assert }) => {
    const teacher1 = await UserFactory.apply('teacher').create()
    const teacher2 = await UserFactory.apply('teacher').create()
    const student = await UserFactory.apply('student').create()
    const cls = await ClassFactory.apply('withBeltSystem')
      .merge({ teacherId: teacher1.id })
      .create()
    const enrollment = await EnrollmentFactory.merge({
      classId: cls.id,
      studentId: student.id,
    }).create()

    const allowed = await BeltPolicy.view(teacher2, enrollment)

    assert.isFalse(allowed)
  })
})
