import Notification from '#models/notification'
import Enrollment from '#models/enrollment'
import StudentEnrolled from '#events/student_enrolled'
import AnnouncementCreated from '#events/announcement_created'
import FeedbackSent from '#events/feedback_sent'

export default class CreateNotification {
  async handle(event: StudentEnrolled) {
    await Notification.create({
      userId: event.teacherId,
      type: 'student_enrolled',
      data: {
        enrollment_id: event.enrollment.id,
        class_id: event.enrollment.classId,
        student_id: event.enrollment.studentId,
        student_first_name: event.studentFirstName,
        class_name: event.className,
      },
    })
  }

  async handleAnnouncementCreated(event: AnnouncementCreated) {
    const enrollments = await Enrollment.query()
      .where('class_id', event.classId)
      .where('status', 'active')

    for (const enrollment of enrollments) {
      await Notification.create({
        userId: enrollment.studentId,
        type: 'announcement_created',
        title: event.announcement.title,
        data: {
          announcement_id: event.announcement.id,
          class_id: event.classId,
          class_name: event.className,
        },
      })
    }
  }

  async handleFeedbackSent(event: FeedbackSent) {
    await Notification.create({
      userId: event.studentId,
      type: 'feedback_received',
      title: 'New feedback received',
      data: {
        feedback_id: event.feedback.id,
        teacher_first_name: event.teacherFirstName,
        class_name: event.className,
      },
    })
  }
}
