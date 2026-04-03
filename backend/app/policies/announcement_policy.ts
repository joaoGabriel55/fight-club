import User from '#models/user'
import Class from '#models/class'
import Enrollment from '#models/enrollment'

export default class AnnouncementPolicy {
  /** Only the class teacher can create announcements */
  static create(user: User, cls: Class): boolean {
    return user.profileType === 'teacher' && cls.teacherId === user.id
  }

  /** Only the class teacher can delete announcements */
  static delete(user: User, cls: Class): boolean {
    return user.profileType === 'teacher' && cls.teacherId === user.id
  }

  /** Teacher of the class OR an active enrolled student can view announcements */
  static async view(user: User, cls: Class): Promise<boolean> {
    if (user.profileType === 'teacher') {
      return cls.teacherId === user.id
    }

    const enrollment = await Enrollment.query()
      .where('class_id', cls.id)
      .where('student_id', user.id)
      .where('status', 'active')
      .first()

    return !!enrollment
  }
}
