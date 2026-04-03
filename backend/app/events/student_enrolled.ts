import Enrollment from '#models/enrollment'

export default class StudentEnrolled {
  constructor(
    public readonly enrollment: Enrollment,
    public readonly teacherId: string,
    public readonly studentFirstName: string,
    public readonly className: string
  ) {}
}
