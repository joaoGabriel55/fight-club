import { Link } from "@tanstack/react-router";
import { useClasses } from "@/domains/classes/hooks/useClasses";
import { useNotifications } from "@/domains/notifications/hooks/useNotifications";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Spinner } from "@/shared/components/ui/spinner";
import { NotificationItem as NotificationItemComponent } from "@/domains/notifications/components/NotificationItem";
import { GraduationCap, Bell, Plus, Users, Calendar } from "lucide-react";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function TeacherDashboard() {
  const { data: classes, isLoading: classesLoading } = useClasses();
  const { data: notifications, isLoading: notifLoading } = useNotifications();

  if (classesLoading || notifLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const classCount = classes?.length ?? 0;
  const unreadCount = notifications?.meta.unread_count ?? 0;

  // Total students across all classes
  const totalStudents =
    classes?.reduce((sum, cls) => sum + (cls.enrollment_count ?? 0), 0) ?? 0;

  // Classes today based on schedule_count and day_of_week
  const today = new Date().getDay(); // 0=Sunday
  // We don't have per-schedule data in the list, so show total class count as fallback
  // The dashboard shows all classes that exist

  const recentNotifications = notifications?.data.slice(0, 5) ?? [];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Classes
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">{DAY_NAMES[today]}</div>
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

      {/* Recent activity */}
      {recentNotifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentNotifications.map((n) => (
              <div
                key={n.id}
                className="text-sm border-b last:border-0 pb-2 last:pb-0"
              >
                <span className="font-medium">{n.title ?? n.type}</span>
                {n.body && (
                  <span className="text-muted-foreground ml-1">{n.body}</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick links */}
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/classes/new">
            <Plus className="h-4 w-4 mr-1" />
            Create class
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/classes">View all classes</Link>
        </Button>
      </div>
    </div>
  );
}
