import User from '#models/user'
import Enrollment from '#models/enrollment'

export default class BeltPolicy {
  /** Only the teacher of the enrollment's class can award belts, and the class must have belt system enabled */
  static async award(user: User, enrollment: Enrollment): Promise<boolean> {
    await enrollment.load('class')
    return (
      user.profileType === 'teacher' &&
      enrollment.class.teacherId === user.id &&
      enrollment.class.hasBeltSystem === true
    )
  }

  /** Teacher of the class OR the enrolled student can view belt history */
  static async view(user: User, enrollment: Enrollment): Promise<boolean> {
    if (enrollment.studentId === user.id) {
      return true
    }

    await enrollment.load('class')
    return user.profileType === 'teacher' && enrollment.class.teacherId === user.id
  }
}
