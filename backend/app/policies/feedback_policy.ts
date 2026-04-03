import User from '#models/user'
import Enrollment from '#models/enrollment'

export default class FeedbackPolicy {
  /** Only the teacher of the enrollment's class can send feedback */
  static async create(user: User, enrollment: Enrollment): Promise<boolean> {
    await enrollment.load('class')
    return user.profileType === 'teacher' && enrollment.class.teacherId === user.id
  }

  /** Teacher of the class OR the enrolled student can view feedback */
  static async view(user: User, enrollment: Enrollment): Promise<boolean> {
    if (enrollment.studentId === user.id) {
      return true
    }

    await enrollment.load('class')
    return user.profileType === 'teacher' && enrollment.class.teacherId === user.id
  }
}
