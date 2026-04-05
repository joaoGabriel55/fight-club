import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import { UserAnonymizer } from '#services/user_anonymizer'
import { UserFactory } from '#database/factories/index'
import { ClassFactory } from '#database/factories/index'
import { EnrollmentFactory } from '#database/factories/index'
import { FeedbackFactory } from '#database/factories/index'
import { BeltProgressFactory } from '#database/factories/index'
import StudentProfile from '#models/student_profile'
import AuditLog from '#models/audit_log'
import Enrollment from '#models/enrollment'
import Feedback from '#models/feedback'
import BeltProgress from '#models/belt_progress'
import { AuditLogService } from '#services/audit_log_service'
import { DateTime } from 'luxon'

test.group('UserAnonymizer', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('sets firstName to "Deleted" and lastName to "User"', async ({ assert }) => {
    const user = await UserFactory.apply('student').create()
    await StudentProfile.create({ userId: user.id, dataConsentAt: DateTime.now() })

    await UserAnonymizer.anonymize(user)

    await user.refresh()
    assert.equal(user.firstName, 'Deleted')
    assert.equal(user.lastName, 'User')
  })

  test('changes email to a deleted hash (not the original)', async ({ assert }) => {
    const user = await UserFactory.apply('student').create()
    await StudentProfile.create({ userId: user.id, dataConsentAt: DateTime.now() })
    const originalEmail = user.email

    await UserAnonymizer.anonymize(user)

    await user.refresh()
    assert.notEqual(user.email, originalEmail)
    assert.isTrue(user.email.startsWith('deleted:'))
  })

  test('sets deletedAt timestamp', async ({ assert }) => {
    const user = await UserFactory.apply('student').create()
    await StudentProfile.create({ userId: user.id, dataConsentAt: DateTime.now() })

    assert.notExists(user.deletedAt)

    await UserAnonymizer.anonymize(user)

    await user.refresh()
    assert.isNotNull(user.deletedAt)
  })

  test('deletes student_profile row', async ({ assert }) => {
    const user = await UserFactory.apply('student').create()
    await StudentProfile.create({ userId: user.id, dataConsentAt: DateTime.now() })

    const profileBefore = await StudentProfile.findBy('userId', user.id)
    assert.isNotNull(profileBefore)

    await UserAnonymizer.anonymize(user)

    const profileAfter = await StudentProfile.findBy('userId', user.id)
    assert.isNull(profileAfter)
  })

  test('hard-deletes enrollments', async ({ assert }) => {
    const student = await UserFactory.apply('student').create()
    await StudentProfile.create({ userId: student.id, dataConsentAt: DateTime.now() })
    const teacher = await UserFactory.apply('teacher').create()
    const cls = await ClassFactory.merge({ teacherId: teacher.id }).create()
    await EnrollmentFactory.merge({
      classId: cls.id,
      studentId: student.id,
    }).create()

    const enrollmentsBefore = await Enrollment.query().where('student_id', student.id)
    assert.equal(enrollmentsBefore.length, 1)

    await UserAnonymizer.anonymize(student)

    const enrollmentsAfter = await Enrollment.query().where('student_id', student.id)
    assert.equal(enrollmentsAfter.length, 0)
  })

  test('hard-deletes feedback for the user enrollments', async ({ assert }) => {
    const student = await UserFactory.apply('student').create()
    await StudentProfile.create({ userId: student.id, dataConsentAt: DateTime.now() })
    const teacher = await UserFactory.apply('teacher').create()
    const cls = await ClassFactory.merge({ teacherId: teacher.id }).create()
    const enrollment = await EnrollmentFactory.merge({
      classId: cls.id,
      studentId: student.id,
    }).create()
    await FeedbackFactory.merge({
      enrollmentId: enrollment.id,
      teacherId: teacher.id,
    }).create()

    const feedbackBefore = await Feedback.query().where('enrollment_id', enrollment.id)
    assert.equal(feedbackBefore.length, 1)

    await UserAnonymizer.anonymize(student)

    const feedbackAfter = await Feedback.query().where('enrollment_id', enrollment.id)
    assert.equal(feedbackAfter.length, 0)
  })

  test('hard-deletes belt_progress for the user enrollments', async ({ assert }) => {
    const student = await UserFactory.apply('student').create()
    await StudentProfile.create({ userId: student.id, dataConsentAt: DateTime.now() })
    const teacher = await UserFactory.apply('teacher').create()
    const cls = await ClassFactory.merge({ teacherId: teacher.id }).create()
    const enrollment = await EnrollmentFactory.merge({
      classId: cls.id,
      studentId: student.id,
    }).create()
    await BeltProgressFactory.merge({
      enrollmentId: enrollment.id,
      awardedBy: teacher.id,
    }).create()

    const beltsBefore = await BeltProgress.query().where('enrollment_id', enrollment.id)
    assert.equal(beltsBefore.length, 1)

    await UserAnonymizer.anonymize(student)

    const beltsAfter = await BeltProgress.query().where('enrollment_id', enrollment.id)
    assert.equal(beltsAfter.length, 0)
  })

  test('sets audit_logs user_id to null', async ({ assert }) => {
    const user = await UserFactory.apply('student').create()
    await StudentProfile.create({ userId: user.id, dataConsentAt: DateTime.now() })

    await AuditLogService.log(user.id, 'login', 'auth', {
      ipAddress: '127.0.0.1',
    })

    const logBefore = await AuditLog.query().where('user_id', user.id).first()
    assert.isNotNull(logBefore)

    await UserAnonymizer.anonymize(user)

    const logAfter = await AuditLog.query().where('action', 'login').first()
    assert.isNotNull(logAfter)
    assert.isNull(logAfter!.userId)
  })

  test('clears password hash so user cannot authenticate', async ({ assert }) => {
    const user = await UserFactory.apply('student').create()
    await StudentProfile.create({ userId: user.id, dataConsentAt: DateTime.now() })

    await UserAnonymizer.anonymize(user)

    await user.refresh()
    assert.equal(user.passwordHash, '')
  })

  test('sets emailHash to null', async ({ assert }) => {
    const user = await UserFactory.apply('student').create()
    await StudentProfile.create({ userId: user.id, dataConsentAt: DateTime.now() })

    assert.isNotNull(user.emailHash)

    await UserAnonymizer.anonymize(user)

    await user.refresh()
    assert.isNull(user.emailHash)
  })
})
