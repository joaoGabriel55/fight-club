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
import { Spinner } from "@/shared/components/ui/spinner";
import { BookOpen, Bell, Megaphone, Shield } from "lucide-react";

export function StudentDashboard() {
  const { data: enrollments, isLoading: enrollLoading } = useEnrollments();
  const { data: notifications, isLoading: notifLoading } = useNotifications();
  const { data: announcements, isLoading: annLoading } = useMyAnnouncements();

  if (enrollLoading || notifLoading || annLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const enrollmentCount = enrollments?.length ?? 0;
  const unreadCount = notifications?.meta.unread_count ?? 0;
  const recentAnnouncements = announcements?.slice(0, 3) ?? [];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Classes Enrolled
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
            <div className="text-2xl font-bold">
              {announcements?.length ?? 0}
            </div>
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

      {/* Recent announcements */}
      {recentAnnouncements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Recent Announcements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentAnnouncements.map((a) => (
              <div key={a.id} className="border-b last:border-0 pb-2 last:pb-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {a.class_name}
                </p>
                <p className="text-sm font-medium">{a.title}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {a.content}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick links */}
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link to="/enrollments">View my classes</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/feedback">My feedback</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link to="/privacy">
            <Shield className="h-4 w-4 mr-1" />
            Privacy center
          </Link>
        </Button>
      </div>
    </div>
  );
}
