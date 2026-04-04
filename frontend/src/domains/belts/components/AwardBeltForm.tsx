import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { awardBeltSchema } from "../schemas/belt.schema";
import { useAwardBelt } from "../hooks/useAwardBelt";
import type { AwardBeltInput } from "../types/belt.types";
import { Label } from "@/shared/components/ui/label";
import { Button } from "@/shared/components/ui/button";
import { Select } from "@/shared/components/ui/select";
import { Calendar } from "@/shared/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { cn } from "@/shared/lib/utils";

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
    control,
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <Label className="text-sm">Award belt</Label>

      <div className="flex gap-3">
        <div className="flex-1">
          <Select {...register("belt_name")}>
            <option value="">Select belt...</option>
            <option value="White">White</option>
            <option value="Yellow">Yellow</option>
            <option value="Orange">Orange</option>
            <option value="Green">Green</option>
            <option value="Blue">Blue</option>
            <option value="Purple">Purple</option>
            <option value="Brown">Brown</option>
            <option value="Black">Black</option>
          </Select>
          {errors.belt_name && (
            <p className="mt-1 text-xs text-destructive">
              {errors.belt_name.message}
            </p>
          )}
        </div>

        <div>
          <Controller
            control={control}
            name="awarded_at"
            render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[180px] justify-start text-left font-normal",
                      !field.value && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value
                      ? format(new Date(field.value), "PPP")
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) =>
                      field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
          />
          {errors.awarded_at && (
            <p className="mt-1 text-xs text-destructive">
              {errors.awarded_at.message}
            </p>
          )}
        </div>
      </div>

      {error && (
        <p className="text-xs text-destructive">
          {(error as any)?.body?.error?.message ?? "Failed to award belt"}
        </p>
      )}

      <Button type="submit" disabled={isPending} size="sm">
        {isPending ? "Awarding..." : "Award belt"}
      </Button>
    </form>
  );
}
