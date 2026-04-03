import type { NotificationItem as NotificationType } from "../types/notification.types";
import { useMarkRead } from "../hooks/useMarkRead";

interface NotificationItemProps {
  notification: NotificationType;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const { mutate: markRead } = useMarkRead();
  const isUnread = notification.read_at === null;

  const handleClick = () => {
    if (isUnread) {
      markRead(notification.id);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left px-4 py-3 border-b transition hover:bg-accent ${
        isUnread ? "bg-accent/50" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        {isUnread && (
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
        )}
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm ${isUnread ? "font-medium" : "text-muted-foreground"}`}
          >
            {notification.title}
          </p>
          {notification.body && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {notification.body}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(notification.created_at).toLocaleString()}
          </p>
        </div>
      </div>
    </button>
  );
}
