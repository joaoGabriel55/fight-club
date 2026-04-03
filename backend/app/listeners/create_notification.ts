import Notification from '#models/notification'
import StudentEnrolled from '#events/student_enrolled'

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
}
