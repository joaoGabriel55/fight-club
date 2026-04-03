import type { NotificationItem as NotificationType } from "../types/notification.types";
import { NotificationItem } from "./NotificationItem";
import { useMarkAllRead } from "../hooks/useMarkAllRead";

interface NotificationPanelProps {
  notifications: NotificationType[];
  unreadCount: number;
  isLoading: boolean;
}

export function NotificationPanel({
  notifications,
  unreadCount,
  isLoading,
}: NotificationPanelProps) {
  const { mutate: markAllRead, isPending } = useMarkAllRead();

  return (
    <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-gray-800 bg-gray-900 shadow-xl z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <h3 className="text-sm font-medium text-gray-100">Notifications</h3>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead()}
            disabled={isPending}
            className="text-xs text-red-400 hover:text-red-300 transition disabled:opacity-50"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto">
        {isLoading ? (
          <p className="text-gray-400 text-sm px-4 py-6 text-center">
            Loading…
          </p>
        ) : notifications.length === 0 ? (
          <p className="text-gray-500 text-sm px-4 py-6 text-center">
            No notifications
          </p>
        ) : (
          notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} />
          ))
        )}
      </div>
    </div>
  );
}
