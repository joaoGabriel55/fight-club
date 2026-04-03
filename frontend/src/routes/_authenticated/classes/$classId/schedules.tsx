import { useState } from "react";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useClass } from "@/domains/classes/hooks/useClass";
import { classesService } from "@/domains/classes/services/classes.service";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Clock, Trash2 } from "lucide-react";

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
    return <p className="text-muted-foreground">Loading schedules...</p>;
  }

  const schedules = cls?.schedules ?? [];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">Schedules</h2>

      {schedules.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No schedules yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {schedules.map((schedule) => (
            <Card key={schedule.id}>
              <CardContent className="flex items-center justify-between py-3 px-4">
                <div className="flex items-center gap-4">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium w-28">
                    {DAY_NAMES[schedule.day_of_week]}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {schedule.start_time.slice(0, 5)} &mdash;{" "}
                    {schedule.end_time.slice(0, 5)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteSchedule(schedule.id)}
                  disabled={deletingId === schedule.id}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  {deletingId === schedule.id ? "Removing..." : "Remove"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
