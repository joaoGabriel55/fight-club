export interface NotificationItem {
  id: string;
  type: string;
  title: string | null;
  body: string | null;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export interface NotificationsResponse {
  data: NotificationItem[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    unread_count: number;
  };
}
