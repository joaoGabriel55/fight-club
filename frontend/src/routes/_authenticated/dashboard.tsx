import { createFileRoute, Link } from "@tanstack/react-router";
import { useMe } from "@/domains/auth/hooks/useMe";
import { useClasses } from "@/domains/classes/hooks/useClasses";
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
import {
  GraduationCap,
  BookOpen,
  Bell,
  Megaphone,
  Plus,
  Swords,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data: user, isLoading } = useMe();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const isTeacher = user?.profile_type === "teacher";

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Swords className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user?.first_name}
          </h1>
          <p className="text-muted-foreground text-sm capitalize">
            {user?.profile_type} account
          </p>
        </div>
      </div>

      {isTeacher ? <TeacherDashboard /> : <StudentDashboard />}
    </div>
  );
}

function TeacherDashboard() {
  const { data: classes } = useClasses();
  const { data: notifications } = useNotifications();

  const classCount = classes?.length ?? 0;
  const unreadCount = notifications?.meta.unread_count ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

function StudentDashboard() {
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
