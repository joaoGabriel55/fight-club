import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import {
  createClassSchema,
  type CreateClassInput,
} from "../schemas/class.schema";
import { useCreateClass } from "../hooks/useCreateClass";
import { ScheduleManager } from "./ScheduleManager";

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
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm font-medium text-gray-300">
            Class name
          </label>
          <input
            id="name"
            type="text"
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            placeholder="e.g. Monday BJJ"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-sm text-red-400">{errors.name.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="martial_art"
            className="text-sm font-medium text-gray-300"
          >
            Martial art
          </label>
          <input
            id="martial_art"
            type="text"
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            placeholder="e.g. BJJ, Muay Thai, Boxing"
            {...register("martial_art")}
          />
          {errors.martial_art && (
            <p className="text-sm text-red-400">{errors.martial_art.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="description"
            className="text-sm font-medium text-gray-300"
          >
            Description{" "}
            <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <textarea
            id="description"
            rows={3}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
            placeholder="Describe the class…"
            {...register("description")}
          />
          {errors.description && (
            <p className="text-sm text-red-400">{errors.description.message}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <input
            id="has_belt_system"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-red-500 focus:ring-red-500"
            {...register("has_belt_system")}
          />
          <label htmlFor="has_belt_system" className="text-sm text-gray-300">
            This class uses a belt/rank system
          </label>
        </div>

        <div className="border-t border-gray-800 pt-4">
          <ScheduleManager />
        </div>

        {error && (
          <p className="rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-400">
            {error.message}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
        >
          {isPending ? "Creating…" : "Create class"}
        </button>
      </form>
    </FormProvider>
  );
}
