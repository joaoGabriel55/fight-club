import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import { UserFactory, ClassFactory, EnrollmentFactory, ReviewFactory } from '#database/factories/index'
import ReviewPolicy from '#policies/review_policy'

test.group('ReviewPolicy', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('enrolled student can create review', async ({ assert }) => {
    const teacher = await UserFactory.apply('teacher').create()
    const student = await UserFactory.apply('student').create()
    const cls = await ClassFactory.merge({ teacherId: teacher.id }).create()
    await EnrollmentFactory.merge({
      classId: cls.id,
      studentId: student.id,
    }).create()

    const allowed = await ReviewPolicy.create(student, cls)

    assert.isTrue(allowed)
  })

  test('non-enrolled student cannot create review', async ({ assert }) => {
    const teacher = await UserFactory.apply('teacher').create()
    const student = await UserFactory.apply('student').create()
    const cls = await ClassFactory.merge({ teacherId: teacher.id }).create()

    const allowed = await ReviewPolicy.create(student, cls)

    assert.isFalse(allowed)
  })

  test('teacher cannot create review', async ({ assert }) => {
    const teacher = await UserFactory.apply('teacher').create()
    const cls = await ClassFactory.merge({ teacherId: teacher.id }).create()

    const allowed = await ReviewPolicy.create(teacher, cls)

    assert.isFalse(allowed)
  })

  test('student with inactive (left) enrollment cannot create review', async ({ assert }) => {
    const teacher = await UserFactory.apply('teacher').create()
    const student = await UserFactory.apply('student').create()
    const cls = await ClassFactory.merge({ teacherId: teacher.id }).create()
    await EnrollmentFactory.merge({
      classId: cls.id,
      studentId: student.id,
      status: 'left',
    }).create()

    const allowed = await ReviewPolicy.create(student, cls)

    assert.isFalse(allowed)
  })

  test('student can update own review', async ({ assert }) => {
    const teacher = await UserFactory.apply('teacher').create()
    const student = await UserFactory.apply('student').create()
    const cls = await ClassFactory.merge({ teacherId: teacher.id }).create()
    const review = await ReviewFactory.merge({
      classId: cls.id,
      studentId: student.id,
    }).create()

    const allowed = ReviewPolicy.update(student, review)

    assert.isTrue(allowed)
  })

  test('student cannot update another student review', async ({ assert }) => {
    const teacher = await UserFactory.apply('teacher').create()
    const studentA = await UserFactory.apply('student').create()
    const studentB = await UserFactory.apply('student').create()
    const cls = await ClassFactory.merge({ teacherId: teacher.id }).create()
    const review = await ReviewFactory.merge({
      classId: cls.id,
      studentId: studentA.id,
    }).create()

    const allowed = ReviewPolicy.update(studentB, review)

    assert.isFalse(allowed)
  })

  test('teacher cannot update student review', async ({ assert }) => {
    const teacher = await UserFactory.apply('teacher').create()
    const student = await UserFactory.apply('student').create()
    const cls = await ClassFactory.merge({ teacherId: teacher.id }).create()
    const review = await ReviewFactory.merge({
      classId: cls.id,
      studentId: student.id,
    }).create()

    const allowed = ReviewPolicy.update(teacher, review)

    assert.isFalse(allowed)
  })

  test('teacher can list reviews for own class', async ({ assert }) => {
    const teacher = await UserFactory.apply('teacher').create()
    const cls = await ClassFactory.merge({ teacherId: teacher.id }).create()

    const allowed = ReviewPolicy.listForTeacher(teacher, cls)

    assert.isTrue(allowed)
  })

  test('teacher cannot list reviews for other class', async ({ assert }) => {
    const teacher1 = await UserFactory.apply('teacher').create()
    const teacher2 = await UserFactory.apply('teacher').create()
    const cls = await ClassFactory.merge({ teacherId: teacher1.id }).create()

    const allowed = ReviewPolicy.listForTeacher(teacher2, cls)

    assert.isFalse(allowed)
  })

  test('student cannot list reviews for class', async ({ assert }) => {
    const teacher = await UserFactory.apply('teacher').create()
    const student = await UserFactory.apply('student').create()
    const cls = await ClassFactory.merge({ teacherId: teacher.id }).create()

    const allowed = ReviewPolicy.listForTeacher(student, cls)

    assert.isFalse(allowed)
  })
})
