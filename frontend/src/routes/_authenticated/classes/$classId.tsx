import {
  createFileRoute,
  Link,
  Outlet,
  useParams,
} from "@tanstack/react-router";
import { useClass } from "@/domains/classes/hooks/useClass";
import { useAuth } from "@/shared/hooks/useAuth";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/classes/$classId")({
  component: ClassDetailLayout,
});

function ClassDetailLayout() {
  const { classId } = useParams({ from: "/_authenticated/classes/$classId" });
  const { data: cls, isLoading, error } = useClass(classId);
  const { user } = useAuth();

  const isTeacher = user?.profile_type === "teacher";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center flex-col gap-3 py-20">
        <p className="text-destructive">
          {(error as any)?.status === 403
            ? "You do not have access to this class."
            : "Failed to load class."}
        </p>
        <Button asChild variant="ghost" size="sm">
          <Link to="/classes">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to classes
          </Link>
        </Button>
      </div>
    );
  }

  if (!cls) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to={isTeacher ? "/classes" : "/enrollments"}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {isTeacher ? "My classes" : "My enrollments"}
        </Link>
      </Button>

      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{cls.name}</h1>
            <p className="text-muted-foreground">{cls.martial_art}</p>
          </div>
          {cls.has_belt_system && (
            <Badge
              variant="outline"
              className="text-yellow-600 border-yellow-600 dark:text-yellow-400 dark:border-yellow-400"
            >
              Belt system
            </Badge>
          )}
        </div>
        {cls.description && (
          <p className="text-sm text-muted-foreground">{cls.description}</p>
        )}
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 border-b">
        {isTeacher && (
          <Link
            to="/classes/$classId/schedules"
            params={{ classId }}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent [&.active]:border-primary [&.active]:text-foreground transition-colors no-underline"
            activeOptions={{ exact: true }}
          >
            Schedules
          </Link>
        )}
        {isTeacher && (
          <Link
            to="/classes/$classId/students"
            params={{ classId }}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent [&.active]:border-primary [&.active]:text-foreground transition-colors no-underline"
            activeOptions={{ exact: true }}
          >
            Students
          </Link>
        )}
        <Link
          to="/classes/$classId/announcements"
          params={{ classId }}
          className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent [&.active]:border-primary [&.active]:text-foreground transition-colors no-underline"
          activeOptions={{ exact: true }}
        >
          Announcements
        </Link>
        {isTeacher && (
          <Link
            to="/classes/$classId/invitations"
            params={{ classId }}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent [&.active]:border-primary [&.active]:text-foreground transition-colors no-underline"
            activeOptions={{ exact: true }}
          >
            Invite links
          </Link>
        )}
      </div>

      <Outlet />
    </div>
  );
}
