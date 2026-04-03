import { useFieldArray, useFormContext } from "react-hook-form";
import type { CreateClassInput } from "../schemas/class.schema";

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
        <span className="text-sm font-medium text-gray-300">Schedules</span>
        <button
          type="button"
          onClick={handleAddSchedule}
          className="text-sm text-red-400 hover:text-red-300 transition"
        >
          + Add schedule
        </button>
      </div>

      {(errors.schedules as any)?.root?.message && (
        <p className="text-sm text-red-400">
          {(errors.schedules as any).root.message}
        </p>
      )}
      {typeof (errors.schedules as any)?.message === "string" && (
        <p className="text-sm text-red-400">
          {(errors.schedules as any).message}
        </p>
      )}

      {fields.length === 0 && (
        <p className="text-sm text-gray-500">
          No schedules yet. Add at least one to create the class.
        </p>
      )}

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="rounded-lg border border-gray-700 bg-gray-800 p-3 flex flex-col gap-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Schedule {index + 1}</span>
            <button
              type="button"
              onClick={() => remove(index)}
              className="text-xs text-gray-500 hover:text-red-400 transition"
            >
              Remove
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor={`schedule-day-${index}`}
              className="text-xs text-gray-400"
            >
              Day
            </label>
            <select
              id={`schedule-day-${index}`}
              className="rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-sm text-gray-100 focus:border-red-500 focus:outline-none"
              {...register(`schedules.${index}.day_of_week`, {
                valueAsNumber: true,
              })}
            >
              {DAY_OPTIONS.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label
                htmlFor={`schedule-start-${index}`}
                className="text-xs text-gray-400"
              >
                Start time
              </label>
              <input
                id={`schedule-start-${index}`}
                type="time"
                className="rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-sm text-gray-100 focus:border-red-500 focus:outline-none"
                {...register(`schedules.${index}.start_time`)}
              />
              {errors.schedules?.[index]?.start_time && (
                <p className="text-xs text-red-400">
                  {errors.schedules[index].start_time.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor={`schedule-end-${index}`}
                className="text-xs text-gray-400"
              >
                End time
              </label>
              <input
                id={`schedule-end-${index}`}
                type="time"
                className="rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-sm text-gray-100 focus:border-red-500 focus:outline-none"
                {...register(`schedules.${index}.end_time`)}
              />
              {errors.schedules?.[index]?.end_time && (
                <p className="text-xs text-red-400">
                  {errors.schedules[index].end_time.message}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
