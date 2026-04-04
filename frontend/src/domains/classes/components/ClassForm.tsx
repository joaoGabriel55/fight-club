import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import {
  createClassSchema,
  type CreateClassInput,
} from "../schemas/class.schema";
import { useCreateClass } from "../hooks/useCreateClass";
import { ScheduleManager } from "./ScheduleManager";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";

export function ClassForm() {
  const navigate = useNavigate();
  const { mutate: createClass, isPending, error } = useCreateClass();

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
    formState: { errors },
  } = methods;

  const onSubmit = (data: CreateClassInput) => {
    createClass(data, {
      onSuccess: (cls) => {
        navigate({ to: "/classes/$classId", params: { classId: cls.id } });
      },
    });
  };

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
          <Input
            id="martial_art"
            type="text"
            placeholder="e.g. BJJ, Muay Thai, Boxing"
            {...register("martial_art")}
          />
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

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Creating..." : "Create class"}
        </Button>
      </form>
    </FormProvider>
  );
}
