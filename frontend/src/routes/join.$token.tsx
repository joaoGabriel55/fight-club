import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { isAuthenticated, ApiError } from "@/shared/lib/api-client";
import { useMe } from "@/domains/auth/hooks/useMe";
import { useJoinClass } from "@/domains/enrollments/hooks/useJoinClass";
import { ConsentDialog } from "@/domains/enrollments/components/ConsentDialog";
import { enrollmentsService } from "@/domains/enrollments/services/enrollments.service";
import { Swords, AlertTriangle, ShieldX } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import bgImage from "@/assets/background-image.jpg";

export const Route = createFileRoute("/join/$token")({
  component: JoinPage,
});

function JoinPage() {
  const { token } = useParams({ from: "/join/$token" });
  const authenticated = isAuthenticated();
  const { data: me, isLoading: meLoading } = useMe();

  const {
    data: classInfo,
    isLoading: classLoading,
    error: classError,
  } = useQuery({
    queryKey: ["invitation-class", token],
    queryFn: () => enrollmentsService.getClassFromToken(token),
    retry: false,
  });

  const { mutate: joinClass, isPending, error: joinError } = useJoinClass();

  if (classLoading || meLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const tokenInvalid =
    classError instanceof ApiError &&
    (classError.status === 410 || classError.status === 404);

  if (tokenInvalid || classError) {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <Card className="relative z-10 w-full max-w-md mx-4 text-center">
          <CardHeader>
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-2" />
            <CardTitle>Invitation expired</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              This invitation has expired or is no longer valid.
            </p>
            <Button asChild variant="outline">
              <Link to="/login">Go to login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!authenticated || !me) {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <Card className="relative z-10 w-full max-w-md mx-4 text-center">
          <CardHeader>
            <Swords className="h-10 w-10 text-primary mx-auto mb-2" />
            <CardTitle>You've been invited to join</CardTitle>
            {classInfo && (
              <p className="text-sm text-muted-foreground mt-1">
                {classInfo.class_name} &middot; {classInfo.martial_art}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              You need an account to join this class.
            </p>
            <div className="flex gap-3 justify-center">
              <Button asChild>
                <a
                  href={`/register?redirect=${encodeURIComponent(`/join/${token}`)}`}
                >
                  Register
                </a>
              </Button>
              <Button asChild variant="outline">
                <a
                  href={`/login?redirect=${encodeURIComponent(`/join/${token}`)}`}
                >
                  Log in
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (me.profile_type === "teacher") {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <Card className="relative z-10 w-full max-w-md mx-4 text-center">
          <CardHeader>
            <ShieldX className="h-12 w-12 text-destructive mx-auto mb-2" />
            <CardTitle>Cannot join as teacher</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Teachers cannot join classes as students.
            </p>
            <Button asChild variant="outline">
              <Link to="/dashboard">Go to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const alreadyEnrolled =
    joinError instanceof ApiError && joinError.status === 409;

  return (
    <div className="min-h-screen flex items-center justify-center">
      {classInfo && (
        <ConsentDialog
          className={classInfo.class_name}
          teacherFirstName={classInfo.teacher_first_name}
          isPending={isPending}
          onConfirm={() => joinClass({ token })}
          onCancel={() => window.history.back()}
        />
      )}
      {alreadyEnrolled && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-lg bg-yellow-900/80 border border-yellow-700 px-4 py-2 text-sm text-yellow-300">
          You are already enrolled in this class.{" "}
          <Link to="/dashboard" className="underline">
            Go to dashboard
          </Link>
        </div>
      )}
    </div>
  );
}
