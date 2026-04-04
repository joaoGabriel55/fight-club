import { createHash } from 'node:crypto'
import { DateTime } from 'luxon'
import User from '#models/user'
import StudentProfile from '#models/student_profile'
import TeacherProfile from '#models/teacher_profile'
import Enrollment from '#models/enrollment'
import Feedback from '#models/feedback'
import BeltProgress from '#models/belt_progress'
import AuditLog from '#models/audit_log'

export class UserAnonymizer {
  static async anonymize(user: User): Promise<void> {
    // 1. Anonymize user PII
    const emailHash = createHash('sha256').update(user.email).digest('hex')

    user.firstName = 'Deleted'
    user.lastName = 'User'
    user.email = `deleted:${emailHash}`
    user.emailHash = null
    user.passwordHash = ''
    user.deletedAt = DateTime.now()
    await user.save()

    // 2. Delete profile rows
    await StudentProfile.query().where('user_id', user.id).delete()
    await TeacherProfile.query().where('user_id', user.id).delete()

    // 3. Hard-delete enrollments and cascading data
    const enrollments = await Enrollment.query().where('student_id', user.id)
    const enrollmentIds = enrollments.map((e) => e.id)

    if (enrollmentIds.length > 0) {
      await Feedback.query().whereIn('enrollment_id', enrollmentIds).delete()
      await BeltProgress.query().whereIn('enrollment_id', enrollmentIds).delete()
      await Enrollment.query().where('student_id', user.id).delete()
    }

    // 4. Anonymize audit logs: set user_id to null
    await AuditLog.query().where('user_id', user.id).update({ user_id: null })
  }
}
