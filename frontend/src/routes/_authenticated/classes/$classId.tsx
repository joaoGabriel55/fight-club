import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
  useParams,
} from "@tanstack/react-router";
import { useClass } from "@/domains/classes/hooks/useClass";
import { useAuth } from "@/shared/hooks/useAuth";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { ArrowLeft, Settings } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/classes/$classId")({
  component: ClassDetailLayout,
});

function ClassDetailLayout() {
  const { pathname } = useLocation();
  const { classId } = useParams({ from: "/_authenticated/classes/$classId" });
  const { data: currentClass, isLoading, error } = useClass(classId);
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

  if (!currentClass) return null;

  const currentTab = pathname.split("/").pop();

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
            <h1 className="text-2xl font-bold tracking-tight">
              {currentClass.name}
            </h1>
            <p className="text-muted-foreground">{currentClass.martial_art}</p>
          </div>
          <div className="flex items-center gap-2">
            {currentClass.has_belt_system && (
              <Badge
                variant="outline"
                className="text-yellow-600 border-yellow-600 dark:text-yellow-400 dark:border-yellow-400"
              >
                Belt system
              </Badge>
            )}
            {isTeacher && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/classes/$classId/edit" params={{ classId }}>
                  <Settings className="h-3 w-3 mr-1" />
                  Edit
                </Link>
              </Button>
            )}
          </div>
        </div>
        {currentClass.description && (
          <p className="text-sm text-muted-foreground">
            {currentClass.description}
          </p>
        )}
      </div>

      {/* Tab navigation */}
      <Tabs defaultValue="overview" className="overscroll-x-contain">
        <TabsList variant="line">
          {isTeacher && (
            <TabsTrigger
              value="schedules"
              {...{ "data-active": currentTab === "schedules" }}
              className="p-4"
              asChild
            >
              <Link
                to="/classes/$classId/schedules"
                params={{ classId }}
                className="text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent [&.active]:border-primary [&.active]:text-foreground transition-colors no-underline"
                activeOptions={{ exact: true }}
              >
                Schedules
              </Link>
            </TabsTrigger>
          )}
          {isTeacher && (
            <TabsTrigger
              value="students"
              {...{ "data-active": currentTab === "students" }}
              className="p-4"
              asChild
            >
              <Link
                to="/classes/$classId/students"
                params={{ classId }}
                className="text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent [&.active]:border-primary [&.active]:text-foreground transition-colors no-underline"
                activeOptions={{ exact: true }}
              >
                Students
              </Link>
            </TabsTrigger>
          )}
          <TabsTrigger
            value="announcements"
            {...{ "data-active": currentTab === "announcements" }}
            className="p-4"
            asChild
          >
            <Link
              to="/classes/$classId/announcements"
              params={{ classId }}
              className="text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent [&.active]:border-primary [&.active]:text-foreground transition-colors no-underline"
              activeOptions={{ exact: true }}
            >
              Announcements
            </Link>
          </TabsTrigger>
          <TabsTrigger
            value="invitations"
            {...{ "data-active": currentTab === "invitations" }}
            className="p-4"
            asChild
          >
            <Link
              to="/classes/$classId/invitations"
              params={{ classId }}
              className="text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent [&.active]:border-primary [&.active]:text-foreground transition-colors no-underline"
              activeOptions={{ exact: true }}
            >
              Invite links
            </Link>
          </TabsTrigger>
          {isTeacher && (
            <TabsTrigger
              value="reviews"
              {...{ "data-active": currentTab === "reviews" }}
              className="p-4"
              asChild
            >
              <Link
                to="/classes/$classId/reviews"
                params={{ classId }}
                className="text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent [&.active]:border-primary [&.active]:text-foreground transition-colors no-underline"
                activeOptions={{ exact: true }}
              >
                Reviews
              </Link>
            </TabsTrigger>
          )}
        </TabsList>
      </Tabs>

      <Outlet />
    </div>
  );
}
