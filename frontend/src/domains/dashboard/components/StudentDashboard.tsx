import { Link } from "@tanstack/react-router";
import { useEnrollments } from "@/domains/enrollments/hooks/useEnrollments";
import { useNotifications } from "@/domains/notifications/hooks/useNotifications";
import { useMyAnnouncements } from "@/domains/announcements/hooks/useMyAnnouncements";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { BookOpen, Bell, Megaphone } from "lucide-react";

export function StudentDashboard() {
  const { data: enrollments } = useEnrollments();
  const { data: notifications } = useNotifications();
  const { data: announcements } = useMyAnnouncements();

  const enrollmentCount = enrollments?.length ?? 0;
  const unreadCount = notifications?.meta.unread_count ?? 0;
  const announcementCount = announcements?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              My Classes
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrollmentCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Announcements
            </CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{announcementCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Notifications
            </CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadCount} unread</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Button asChild variant="outline">
          <Link to="/enrollments">View my classes</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/feedback">View feedback</Link>
        </Button>
      </div>
    </div>
  );
}
