import { createFileRoute } from "@tanstack/react-router";
import { useEnrollments } from "@/domains/enrollments/hooks/useEnrollments";
import { useLeaveClass } from "@/domains/enrollments/hooks/useLeaveClass";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/enrollments")({
  component: EnrollmentsPage,
});

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function EnrollmentsPage() {
  const { data: enrollments, isLoading } = useEnrollments();
  const { mutate: leaveClass, isPending: isLeaving } = useLeaveClass();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-100 mb-6">My classes</h1>

      {!enrollments || enrollments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-700 px-4 py-12 text-center">
          <p className="text-gray-400">You are not enrolled in any classes.</p>
          <p className="text-sm text-gray-600 mt-1">
            Ask your teacher for an invite link to join a class.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {enrollments.map((enrollment) => (
            <div
              key={enrollment.id}
              className="rounded-xl border border-gray-700 bg-gray-900 p-5 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-gray-100">
                    {enrollment.class.name}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {enrollment.class.martial_art} ·{" "}
                    {enrollment.class.teacher_first_name}
                  </p>
                </div>
                {enrollment.class.has_belt_system && (
                  <span className="rounded-full bg-yellow-900/40 px-2 py-0.5 text-xs text-yellow-400 border border-yellow-800">
                    Belt system
                  </span>
                )}
              </div>

              {enrollment.class.description && (
                <p className="text-sm text-gray-500 line-clamp-2">
                  {enrollment.class.description}
                </p>
              )}

              {enrollment.class.schedules.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {enrollment.class.schedules.map((s) => (
                    <span
                      key={s.id}
                      className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-400"
                    >
                      {DAY_NAMES[s.day_of_week]} {s.start_time.slice(0, 5)}–
                      {s.end_time.slice(0, 5)}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-gray-800">
                <p className="text-xs text-gray-600">
                  Joined {new Date(enrollment.joined_at).toLocaleDateString()}
                </p>

                {confirmingId === enrollment.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Leave class?</span>
                    <button
                      onClick={() =>
                        leaveClass(enrollment.id, {
                          onSettled: () => setConfirmingId(null),
                        })
                      }
                      disabled={isLeaving}
                      className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                    >
                      {isLeaving ? "Leaving…" : "Yes, leave"}
                    </button>
                    <button
                      onClick={() => setConfirmingId(null)}
                      className="text-xs text-gray-400 hover:text-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmingId(enrollment.id)}
                    className="text-xs text-gray-500 hover:text-red-400 transition"
                  >
                    Leave class
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
