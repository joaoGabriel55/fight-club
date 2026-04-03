import { useState } from "react";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useClass } from "@/domains/classes/hooks/useClass";
import { classesService } from "@/domains/classes/services/classes.service";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute(
  "/_authenticated/classes/$classId/schedules",
)({
  component: ClassSchedulesPage,
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

function ClassSchedulesPage() {
  const { classId } = useParams({
    from: "/_authenticated/classes/$classId/schedules",
  });
  const { data: cls, isLoading } = useClass(classId);
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteSchedule = async (scheduleId: string) => {
    setDeletingId(scheduleId);
    try {
      await classesService.deleteSchedule(classId, scheduleId);
      queryClient.invalidateQueries({ queryKey: ["classes", classId] });
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return <p className="text-gray-400">Loading schedules…</p>;
  }

  const schedules = cls?.schedules ?? [];

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-100 mb-4">Schedules</h2>

      {schedules.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-700 px-4 py-8 text-center">
          <p className="text-gray-400">No schedules yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-900 px-4 py-3"
            >
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-100 w-28">
                  {DAY_NAMES[schedule.day_of_week]}
                </span>
                <span className="text-sm text-gray-400">
                  {schedule.start_time.slice(0, 5)} —{" "}
                  {schedule.end_time.slice(0, 5)}
                </span>
              </div>
              <button
                onClick={() => handleDeleteSchedule(schedule.id)}
                disabled={deletingId === schedule.id}
                className="text-xs text-gray-500 hover:text-red-400 disabled:opacity-50 transition"
              >
                {deletingId === schedule.id ? "Removing…" : "Remove"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
