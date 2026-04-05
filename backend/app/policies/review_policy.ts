import User from '#models/user'
import Class from '#models/class'
import Enrollment from '#models/enrollment'
import Review from '#models/review'

export default class ReviewPolicy {
  /**
   * Student can create a review if they have an active enrollment
   */
  static async create(user: User, cls: Class): Promise<boolean> {
    if (user.profileType !== 'student') {
      return false
    }

    const enrollment = await Enrollment.query()
      .where('class_id', cls.id)
      .where('student_id', user.id)
      .where('status', 'active')
      .first()

    return !!enrollment
  }

  /**
   * Student can update their own review
   */
  static update(user: User, review: Review): boolean {
    return user.profileType === 'student' && review.studentId === user.id
  }

  /**
   * Teacher can view anonymous reviews for their own class
   */
  static listForTeacher(user: User, cls: Class): boolean {
    return user.profileType === 'teacher' && cls.teacherId === user.id
  }
}
