import BeltProgress from '#models/belt_progress'

export default class BeltAwarded {
  constructor(
    public readonly beltProgress: BeltProgress,
    public readonly studentId: string,
    public readonly beltName: string,
    public readonly className: string
  ) {}
}
