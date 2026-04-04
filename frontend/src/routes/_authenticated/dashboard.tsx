import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useMe } from "@/domains/auth/hooks/useMe";
import { Swords } from "lucide-react";
import { TeacherDashboard } from "@/domains/dashboard/components/TeacherDashboard";
import { StudentDashboard } from "@/domains/dashboard/components/StudentDashboard";
import { Spinner } from "@/shared/components/ui/spinner";
import { useNotificationPermission } from "@/shared/hooks/useNotificationPermission";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data: user, isLoading } = useMe();
  const { permission, isSupported, requestPermission } =
    useNotificationPermission();

  // Ask for notification permission on first dashboard visit
  useEffect(() => {
    if (isSupported && permission === "default") {
      requestPermission();
    }
  }, [isSupported, permission, requestPermission]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
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
