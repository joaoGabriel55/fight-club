import { MARTIAL_ARTS } from "@/domains/auth/types/auth.types";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { NativeSelect } from "@/shared/components/ui/select";
import { Separator } from "@/shared/components/ui/separator";
import { Textarea } from "@/shared/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useClass } from "../hooks/useClass";
import { useCreateClass } from "../hooks/useCreateClass";
import { useUpdateClass } from "../hooks/useUpdateClass";
import {
  createClassSchema,
  type CreateClassInput,
} from "../schemas/class.schema";
import { ScheduleManager } from "./ScheduleManager";

interface ClassFormProps {
  classId?: string;
}

export function ClassForm({ classId }: ClassFormProps) {
  const navigate = useNavigate();
  const isEdit = !!classId;
  const { data: currentClass, isLoading: isLoadingClass } = useClass(
    classId ?? "",
  );
  const {
    mutate: createClass,
    isPending: isCreating,
    error: createError,
  } = useCreateClass();
  const {
    mutate: updateClass,
    isPending: isUpdating,
    error: updateError,
  } = useUpdateClass(classId!);

  const methods = useForm<CreateClassInput>({
    resolver: zodResolver(createClassSchema),
    defaultValues: {
      name: "",
      martial_art: "",
      has_belt_system: false,
      description: "",
      schedules: [],
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = methods;

  useEffect(() => {
    if (isEdit && currentClass) {
      reset({
        name: currentClass.name,
        martial_art: currentClass.martial_art,
        has_belt_system: currentClass.has_belt_system,
        description: currentClass.description ?? "",
        schedules: currentClass.schedules.map((s) => ({
          day_of_week: s.day_of_week,
          start_time: s.start_time,
          end_time: s.end_time,
        })),
      });
    }
  }, [isEdit, currentClass, reset]);

  const onSubmit = (data: CreateClassInput) => {
    if (isEdit) {
      updateClass(
        {
          name: data.name,
          martial_art: data.martial_art,
          has_belt_system: data.has_belt_system,
          description: data.description ?? null,
        },
        {
          onSuccess: () => {
            navigate({ to: "/classes/$classId", params: { classId } });
          },
        },
      );
    } else {
      createClass(data, {
        onSuccess: (cls) => {
          navigate({ to: "/classes/$classId", params: { classId: cls.id } });
        },
      });
    }
  };

  if (isEdit && isLoadingClass) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const isPending = isCreating || isUpdating;
  const error = createError || updateError;

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-5"
        noValidate
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Class name</Label>
          <Input
            id="name"
            type="text"
            placeholder="e.g. Monday BJJ"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="martial_art">Martial art</Label>
          <NativeSelect id="martial_art" {...register("martial_art")}>
            <option value="">Select a martial art</option>
            {MARTIAL_ARTS.map((art) => (
              <option key={art} value={art}>
                {art}
              </option>
            ))}
          </NativeSelect>
          {errors.martial_art && (
            <p className="text-sm text-destructive">
              {errors.martial_art.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="description">
            Description{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </Label>
          <Textarea
            id="description"
            rows={3}
            placeholder="Describe the class..."
            {...register("description")}
          />
          {errors.description && (
            <p className="text-sm text-destructive">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <input
            id="has_belt_system"
            type="checkbox"
            className="h-4 w-4 shrink-0 rounded border border-input accent-primary"
            {...register("has_belt_system")}
          />
          <Label
            htmlFor="has_belt_system"
            className="font-normal cursor-pointer"
          >
            This class uses a belt/rank system
          </Label>
        </div>

        <Separator />

        <ScheduleManager />

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error.message}
          </p>
        )}

        <Button
          type="submit"
          disabled={isPending || (isEdit && !isDirty)}
          className="w-full"
        >
          {isPending
            ? isEdit
              ? "Saving..."
              : "Creating..."
            : isEdit
              ? "Save changes"
              : "Create class"}
        </Button>
      </form>
    </FormProvider>
  );
}
