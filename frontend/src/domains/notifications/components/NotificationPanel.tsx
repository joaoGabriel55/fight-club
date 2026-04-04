import type { NotificationItem as NotificationType } from "../types/notification.types";
import { NotificationItem } from "./NotificationItem";
import { useMarkAllRead } from "../hooks/useMarkAllRead";
import { Button } from "@/shared/components/ui/button";

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
    <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border bg-popover text-popover-foreground shadow-xl z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="text-sm font-medium">Notifications</h3>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllRead()}
            disabled={isPending}
            className="text-primary text-xs h-7"
          >
            Mark all read
          </Button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto">
        {isLoading ? (
          <p className="text-muted-foreground text-sm px-4 py-6 text-center">
            Loading...
          </p>
        ) : notifications.length === 0 ? (
          <p className="text-muted-foreground text-sm px-4 py-6 text-center">
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
