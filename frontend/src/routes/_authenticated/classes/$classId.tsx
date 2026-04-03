import {
  createFileRoute,
  Link,
  Outlet,
  useParams,
} from "@tanstack/react-router";
import { useClass } from "@/domains/classes/hooks/useClass";

export const Route = createFileRoute("/_authenticated/classes/$classId")({
  component: ClassDetailLayout,
});

function ClassDetailLayout() {
  const { classId } = useParams({ from: "/_authenticated/classes/$classId" });
  const { data: cls, isLoading, error } = useClass(classId);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center flex-col gap-3">
        <p className="text-red-400">
          {(error as any)?.status === 403
            ? "You do not have access to this class."
            : "Failed to load class."}
        </p>
        <Link
          to="/classes"
          className="text-sm text-gray-400 hover:text-gray-200 transition"
        >
          ← Back to classes
        </Link>
      </div>
    );
  }

  if (!cls) return null;

  return (
    <div className="min-h-screen px-4 py-8 max-w-4xl mx-auto">
      <div className="mb-4">
        <Link
          to="/classes"
          className="text-sm text-gray-400 hover:text-gray-200 transition"
        >
          ← My classes
        </Link>
      </div>

      <div className="mb-6">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">{cls.name}</h1>
            <p className="text-gray-400">{cls.martial_art}</p>
          </div>
          {cls.has_belt_system && (
            <span className="rounded-full bg-yellow-900/40 px-2 py-0.5 text-xs text-yellow-400 border border-yellow-800">
              Belt system
            </span>
          )}
        </div>
        {cls.description && (
          <p className="text-sm text-gray-500 mt-2">{cls.description}</p>
        )}
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-gray-800 mb-6">
        <Link
          to="/classes/$classId/schedules"
          params={{ classId }}
          className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 border-b-2 border-transparent [&.active]:border-red-500 [&.active]:text-gray-100 transition"
          activeOptions={{ exact: true }}
        >
          Schedules
        </Link>
        <Link
          to="/classes/$classId/students"
          params={{ classId }}
          className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 border-b-2 border-transparent [&.active]:border-red-500 [&.active]:text-gray-100 transition"
          activeOptions={{ exact: true }}
        >
          Students
        </Link>
        <Link
          to="/classes/$classId/announcements"
          params={{ classId }}
          className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 border-b-2 border-transparent [&.active]:border-red-500 [&.active]:text-gray-100 transition"
          activeOptions={{ exact: true }}
        >
          Announcements
        </Link>
        <Link
          to="/classes/$classId/invitations"
          params={{ classId }}
          className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 border-b-2 border-transparent [&.active]:border-red-500 [&.active]:text-gray-100 transition"
          activeOptions={{ exact: true }}
        >
          Invite links
        </Link>
      </div>

      <Outlet />
    </div>
  );
}
