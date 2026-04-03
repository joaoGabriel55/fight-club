import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { isAuthenticated, ApiError } from "@/shared/lib/api-client";
import { useMe } from "@/domains/auth/hooks/useMe";
import { useJoinClass } from "@/domains/enrollments/hooks/useJoinClass";
import { ConsentDialog } from "@/domains/enrollments/components/ConsentDialog";
import { enrollmentsService } from "@/domains/enrollments/services/enrollments.service";

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
        <p className="text-gray-400">Loading…</p>
      </div>
    );
  }

  const tokenInvalid =
    classError instanceof ApiError &&
    (classError.status === 410 || classError.status === 404);

  if (tokenInvalid || classError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-2xl font-bold text-gray-100">Invitation expired</h1>
        <p className="text-gray-400">
          This invitation has expired or is no longer valid.
        </p>
        <Link
          to="/login"
          className="text-sm text-red-400 hover:text-red-300 transition"
        >
          Go to login
        </Link>
      </div>
    );
  }

  if (!authenticated || !me) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-100">
            You've been invited to join
          </h1>
          {classInfo && (
            <p className="mt-1 text-gray-400">
              {classInfo.class_name} · {classInfo.martial_art}
            </p>
          )}
        </div>
        <p className="text-gray-400 text-center max-w-sm">
          You need an account to join this class.
        </p>
        <div className="flex gap-3">
          <a
            href={`/register?redirect=${encodeURIComponent(`/join/${token}`)}`}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition"
          >
            Register
          </a>
          <a
            href={`/login?redirect=${encodeURIComponent(`/join/${token}`)}`}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition"
          >
            Log in
          </a>
        </div>
      </div>
    );
  }

  if (me.profile_type === "teacher") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-xl font-bold text-gray-100">
          Cannot join as teacher
        </h1>
        <p className="text-gray-400">
          Teachers cannot join classes as students.
        </p>
        <Link
          to="/dashboard"
          className="text-sm text-red-400 hover:text-red-300 transition"
        >
          Go to dashboard
        </Link>
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
