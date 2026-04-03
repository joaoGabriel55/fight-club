import { createFileRoute } from "@tanstack/react-router";
import { useNotifications } from "@/domains/notifications/hooks/useNotifications";
import { useMarkAllRead } from "@/domains/notifications/hooks/useMarkAllRead";
import { NotificationItem } from "@/domains/notifications/components/NotificationItem";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const { data, isLoading } = useNotifications();
  const { mutate: markAllRead, isPending } = useMarkAllRead();

  const notifications = data?.data ?? [];
  const unreadCount = data?.meta.unread_count ?? 0;

  return (
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead()}
            disabled={isPending}
            className="text-sm text-red-400 hover:text-red-300 transition disabled:opacity-50"
          >
            Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-gray-400">Loading…</p>
      ) : notifications.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-700 px-4 py-8 text-center">
          <p className="text-gray-400">No notifications</p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-800 overflow-hidden">
          {notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} />
          ))}
        </div>
      )}
    </div>
  );
}
