import Enrollment from '#models/enrollment'
import StudentEnrolled from '#events/student_enrolled'
import AnnouncementCreated from '#events/announcement_created'
import FeedbackSent from '#events/feedback_sent'
import BeltAwarded from '#events/belt_awarded'
import { NotificationService } from '#services/notification_service'

export default class CreateNotification {
  async handle(event: StudentEnrolled) {
    await NotificationService.createNotification(
      event.teacherId,
      'student_enrolled',
      'New student enrolled',
      `${event.studentFirstName} joined ${event.className}`,
      {
        enrollment_id: event.enrollment.id,
        class_id: event.enrollment.classId,
        student_id: event.enrollment.studentId,
        student_first_name: event.studentFirstName,
        class_name: event.className,
      }
    )
  }

  async handleAnnouncementCreated(event: AnnouncementCreated) {
    const enrollments = await Enrollment.query()
      .where('class_id', event.classId)
      .where('status', 'active')

    for (const enrollment of enrollments) {
      await NotificationService.createNotification(
        enrollment.studentId,
        'announcement_created',
        event.announcement.title,
        null,
        {
          announcement_id: event.announcement.id,
          class_id: event.classId,
          class_name: event.className,
        }
      )
    }
  }

  async handleFeedbackSent(event: FeedbackSent) {
    await NotificationService.createNotification(
      event.studentId,
      'feedback_received',
      'New feedback received',
      null,
      {
        feedback_id: event.feedback.id,
        teacher_first_name: event.teacherFirstName,
        class_name: event.className,
      }
    )
  }

  async handleBeltAwarded(event: BeltAwarded) {
    await NotificationService.createNotification(
      event.studentId,
      'belt_awarded',
      'New belt awarded!',
      `You have been awarded the ${event.beltName} belt in ${event.className}`,
      {
        belt_progress_id: event.beltProgress.id,
        belt_name: event.beltName,
        class_name: event.className,
      }
    )
  }
}
