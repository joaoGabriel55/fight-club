import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { awardBeltSchema } from "../schemas/belt.schema";
import { useAwardBelt } from "../hooks/useAwardBelt";
import type { AwardBeltInput } from "../types/belt.types";

interface AwardBeltFormProps {
  enrollmentId: string;
  onSuccess?: () => void;
}

export function AwardBeltForm({ enrollmentId, onSuccess }: AwardBeltFormProps) {
  const { mutate: award, isPending, error } = useAwardBelt(enrollmentId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AwardBeltInput>({
    resolver: zodResolver(awardBeltSchema),
    defaultValues: {
      belt_name: "",
      awarded_at: new Date().toISOString().split("T")[0],
    },
  });

  const onSubmit = (data: AwardBeltInput) => {
    award(data, {
      onSuccess: () => {
        reset();
        onSuccess?.();
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-gray-300">Award belt</h3>

      <div className="flex gap-3">
        <div className="flex-1">
          <select
            {...register("belt_name")}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none"
          >
            <option value="">Select belt…</option>
            <option value="White">White</option>
            <option value="Yellow">Yellow</option>
            <option value="Orange">Orange</option>
            <option value="Green">Green</option>
            <option value="Blue">Blue</option>
            <option value="Purple">Purple</option>
            <option value="Brown">Brown</option>
            <option value="Black">Black</option>
          </select>
          {errors.belt_name && (
            <p className="mt-1 text-xs text-red-400">
              {errors.belt_name.message}
            </p>
          )}
        </div>

        <div>
          <input
            type="date"
            {...register("awarded_at")}
            className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none"
          />
          {errors.awarded_at && (
            <p className="mt-1 text-xs text-red-400">
              {errors.awarded_at.message}
            </p>
          )}
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-400">
          {(error as any)?.body?.error?.message ?? "Failed to award belt"}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
      >
        {isPending ? "Awarding…" : "Award belt"}
      </button>
    </form>
  );
}
