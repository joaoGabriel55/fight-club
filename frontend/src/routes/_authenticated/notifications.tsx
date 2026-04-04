import { createFileRoute } from "@tanstack/react-router";
import { useNotifications } from "@/domains/notifications/hooks/useNotifications";
import { useMarkAllRead } from "@/domains/notifications/hooks/useMarkAllRead";
import { NotificationItem } from "@/domains/notifications/components/NotificationItem";
import { Bell } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const { data, isLoading } = useNotifications();
  const { mutate: markAllRead, isPending } = useMarkAllRead();

  const notifications = data?.data ?? [];
  const unreadCount = data?.meta.unread_count ?? 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllRead()}
            disabled={isPending}
            className="text-primary"
          >
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : notifications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No notifications</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} />
          ))}
        </Card>
      )}
    </div>
  );
}
