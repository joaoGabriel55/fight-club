import Announcement from '#models/announcement'

export default class AnnouncementCreated {
  constructor(
    public readonly announcement: Announcement,
    public readonly classId: string,
    public readonly className: string
  ) {}
}
