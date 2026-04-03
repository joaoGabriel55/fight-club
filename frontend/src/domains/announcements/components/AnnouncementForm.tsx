import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createAnnouncementSchema,
  type CreateAnnouncementInput,
} from "../schemas/announcement.schema";
import { useCreateAnnouncement } from "../hooks/useCreateAnnouncement";

interface AnnouncementFormProps {
  classId: string;
  onSuccess?: () => void;
}

export function AnnouncementForm({
  classId,
  onSuccess,
}: AnnouncementFormProps) {
  const { mutate: create, isPending, error } = useCreateAnnouncement(classId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAnnouncementInput>({
    resolver: zodResolver(createAnnouncementSchema),
    defaultValues: { title: "", content: "" },
  });

  const onSubmit = (data: CreateAnnouncementInput) => {
    create(data, {
      onSuccess: () => {
        reset();
        onSuccess?.();
      },
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-xl border border-gray-700 bg-gray-800 p-4 flex flex-col gap-3"
      noValidate
    >
      <h3 className="text-sm font-medium text-gray-200">New announcement</h3>

      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-xs text-gray-400">
          Title
        </label>
        <input
          id="title"
          type="text"
          className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          placeholder="e.g. Class cancelled this week"
          {...register("title")}
        />
        {errors.title && (
          <p className="text-sm text-red-400">{errors.title.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="content" className="text-xs text-gray-400">
          Content
        </label>
        <textarea
          id="content"
          rows={3}
          className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
          placeholder="Write your announcement…"
          {...register("content")}
        />
        {errors.content && (
          <p className="text-sm text-red-400">{errors.content.message}</p>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-400">
          {error.message}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition disabled:opacity-40"
        >
          {isPending ? "Posting…" : "Post announcement"}
        </button>
      </div>
    </form>
  );
}
