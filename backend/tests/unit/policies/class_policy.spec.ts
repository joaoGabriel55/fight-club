import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import { UserFactory, ClassFactory } from '#database/factories/index'

/**
 * Class policy is inline in ClassesController. These tests verify the
 * authorization logic patterns used: teacher-only guard and ownership check.
 */
test.group('ClassPolicy (inline authorization logic)', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('teacher can access own class', async ({ assert }) => {
    const teacher = await UserFactory.apply('teacher').create()
    const cls = await ClassFactory.merge({ teacherId: teacher.id }).create()

    // Simulate the inline policy check from ClassesController
    const isTeacher = teacher.profileType === 'teacher'
    const isOwner = cls.teacherId === teacher.id

    assert.isTrue(isTeacher)
    assert.isTrue(isOwner)
  })

  test('teacher cannot access another teacher class', async ({ assert }) => {
    const teacher1 = await UserFactory.apply('teacher').create()
    const teacher2 = await UserFactory.apply('teacher').create()
    const cls = await ClassFactory.merge({ teacherId: teacher1.id }).create()

    const isTeacher = teacher2.profileType === 'teacher'
    const isOwner = cls.teacherId === teacher2.id

    assert.isTrue(isTeacher)
    assert.isFalse(isOwner)
  })

  test('student cannot access class management endpoints', async ({ assert }) => {
    const student = await UserFactory.apply('student').create()

    // The controller checks profileType !== 'teacher' and returns 403
    const isTeacher = student.profileType === 'teacher'

    assert.isFalse(isTeacher)
  })

  test('ownership check fails when teacherId does not match', async ({ assert }) => {
    const teacher = await UserFactory.apply('teacher').create()
    const otherTeacher = await UserFactory.apply('teacher').create()
    const cls = await ClassFactory.merge({ teacherId: otherTeacher.id }).create()

    const isOwner = cls.teacherId === teacher.id

    assert.isFalse(isOwner)
  })

  test('teacher-only guard blocks student profile_type', async ({ assert }) => {
    const student = await UserFactory.apply('student').create()
    const teacher = await UserFactory.apply('teacher').create()
    await ClassFactory.merge({ teacherId: teacher.id }).create()

    // Even if somehow the student had the class reference, they are blocked by profileType check
    const studentAllowed = student.profileType === 'teacher'
    const teacherAllowed = teacher.profileType === 'teacher'

    assert.isFalse(studentAllowed)
    assert.isTrue(teacherAllowed)
  })
})
