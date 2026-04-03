import Feedback from '#models/feedback'

export default class FeedbackSent {
  constructor(
    public readonly feedback: Feedback,
    public readonly studentId: string,
    public readonly teacherFirstName: string,
    public readonly className: string
  ) {}
}
