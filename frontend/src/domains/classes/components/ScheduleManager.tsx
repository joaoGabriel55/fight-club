import { useFieldArray, useFormContext } from "react-hook-form";
import type { CreateClassInput } from "../schemas/class.schema";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Button } from "@/shared/components/ui/button";
import { NativeSelect } from "@/shared/components/ui/select";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

const DAY_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export function ScheduleManager() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<CreateClassInput>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "schedules",
  });

  const handleAddSchedule = () => {
    append({ day_of_week: 1, start_time: "09:00", end_time: "10:00" });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Label>Schedules</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleAddSchedule}
          className="text-primary"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add schedule
        </Button>
      </div>

      {(errors.schedules as any)?.root?.message && (
        <p className="text-sm text-destructive">
          {(errors.schedules as any).root.message}
        </p>
      )}
      {typeof (errors.schedules as any)?.message === "string" && (
        <p className="text-sm text-destructive">
          {(errors.schedules as any).message}
        </p>
      )}

      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No schedules yet. Add at least one to create the class.
        </p>
      )}

      {fields.map((field, index) => (
        <Card key={field.id}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Schedule {index + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(index)}
                className="text-muted-foreground hover:text-destructive h-7"
                aria-label="Remove"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor={`schedule-day-${index}`} className="text-xs">
                Day
              </Label>
              <NativeSelect
                id={`schedule-day-${index}`}
                {...register(`schedules.${index}.day_of_week`, {
                  valueAsNumber: true,
                })}
              >
                {DAY_OPTIONS.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor={`schedule-start-${index}`} className="text-xs">
                  Start time
                </Label>
                <Input
                  id={`schedule-start-${index}`}
                  type="time"
                  step="60"
                  className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                  {...register(`schedules.${index}.start_time`)}
                />
                {errors.schedules?.[index]?.start_time && (
                  <p className="text-xs text-destructive">
                    {errors.schedules[index].start_time.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor={`schedule-end-${index}`} className="text-xs">
                  End time
                </Label>
                <Input
                  id={`schedule-end-${index}`}
                  type="time"
                  step="60"
                  className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                  {...register(`schedules.${index}.end_time`)}
                />
                {errors.schedules?.[index]?.end_time && (
                  <p className="text-xs text-destructive">
                    {errors.schedules[index].end_time.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
