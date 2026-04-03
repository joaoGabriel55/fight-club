export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: { first_name: string };
  created_at: string;
}

export interface MyAnnouncement extends Announcement {
  class_name: string;
  class_id: string;
}

export interface CreateAnnouncementInput {
  title: string;
  content: string;
}
