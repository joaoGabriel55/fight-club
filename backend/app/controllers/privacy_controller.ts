import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Enrollment from '#models/enrollment'
import Feedback from '#models/feedback'
import BeltProgress from '#models/belt_progress'
import Announcement from '#models/announcement'
import { AuditLogService } from '#services/audit_log_service'
import { UserAnonymizer } from '#services/user_anonymizer'

const PRIVACY_POLICY = `Fight Club Privacy Policy

Last updated: 2026-04-01

1. Data We Collect
We collect the following personal information when you create an account:
- Name (first and last)
- Email address
- Date of birth
- Profile type (teacher or student)

For students, we may also collect:
- Weight and height (optional)
- Training enrollment data
- Belt progression history

2. How We Use Your Data
Your data is used to:
- Provide the Fight Club training management service
- Enable teachers to track student progress
- Generate AI-powered training improvement tips (anonymized, no PII sent to AI)
- Send notifications about class announcements, feedback, and belt awards

3. Data Protection
- Sensitive fields (email, last name, date of birth, feedback content) are encrypted at rest
- Authentication tokens are stored as hashed values
- All API communication uses HTTPS
- AI features never receive personally identifiable information

4. Data Sharing
- Your first name and belt level are shared with your class teacher upon enrollment
- Your email, last name, date of birth, weight, and height are never shared with teachers
- We do not sell or share your data with third parties

5. Your Rights
You have the right to:
- Export all your personal data (GET /api/v1/privacy/my-data)
- Request full account erasure (DELETE /api/v1/privacy/my-data)
- Withdraw from any class at any time

6. Account Erasure
When you delete your account:
- Your personal information is anonymized
- Your enrollments, feedback, and belt progress are permanently deleted
- Audit logs are retained for accountability but with anonymized user references

7. Contact
For privacy inquiries, contact the platform administrator.`

export default class PrivacyController {
  /**
   * GET /api/v1/privacy/my-data
   * Export all personal data as JSON.
   */
  async exportData({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    // Load enrollments
    const enrollments = await Enrollment.query().where('student_id', user.id).preload('class')

    // Load feedback
    const enrollmentIds = enrollments.map((e) => e.id)
    let feedbackList: Feedback[] = []
    if (enrollmentIds.length > 0) {
      feedbackList = await Feedback.query()
        .whereIn('enrollment_id', enrollmentIds)
        .preload('enrollment', (q) => q.preload('class'))
        .orderBy('created_at', 'desc')
    }

    // Load belt progress
    let beltList: BeltProgress[] = []
    if (enrollmentIds.length > 0) {
      beltList = await BeltProgress.query()
        .whereIn('enrollment_id', enrollmentIds)
        .preload('enrollment', (q) => q.preload('class'))
        .orderBy('created_at', 'desc')
    }

    // Load announcements from enrolled classes
    const classIds = enrollments.map((e) => e.classId)
    let announcements: Announcement[] = []
    if (classIds.length > 0) {
      announcements = await Announcement.query()
        .whereIn('class_id', classIds)
        .preload('class')
        .orderBy('created_at', 'desc')
    }

    const exportData = {
      account: {
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        profile_type: user.profileType,
        created_at: user.createdAt,
      },
      enrollments: enrollments.map((e) => ({
        class_name: e.class.name,
        joined_at: e.joinedAt,
        status: e.status,
      })),
      feedback_received: feedbackList.map((f) => ({
        content: f.content,
        created_at: f.createdAt,
        class_name: f.enrollment.class.name,
      })),
      belt_progress: beltList.map((b) => ({
        belt_name: b.beltName,
        awarded_at: b.awardedAt,
        class_name: b.enrollment.class.name,
      })),
      announcements_received: announcements.map((a) => ({
        title: a.title,
        content: a.content,
        class_name: a.class.name,
        created_at: a.createdAt,
      })),
    }

    await AuditLogService.log(user.id, 'data_export_requested', 'user', {
      ipAddress: request.ip(),
    })

    return response.status(200).send(exportData)
  }

  /**
   * DELETE /api/v1/privacy/my-data
   * Full account erasure.
   */
  async eraseData({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    await AuditLogService.log(user.id, 'account_erasure_requested', 'user', {
      ipAddress: request.ip(),
    })

    // Revoke current token
    const currentToken = auth.user!.currentAccessToken
    await User.accessTokens.delete(user, currentToken.identifier)

    await UserAnonymizer.anonymize(user)

    response.clearCookie('auth_token', { path: '/' })
    return response.status(204).send(null)
  }

  /**
   * GET /api/v1/privacy/policy
   * Return privacy policy text (no auth required).
   */
  async policy({ response }: HttpContext) {
    return response.status(200).send({ content: PRIVACY_POLICY })
  }
}
