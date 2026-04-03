import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  sendFeedbackSchema,
  type SendFeedbackInput,
} from "../schemas/feedback.schema";
import { useSendFeedback } from "../hooks/useSendFeedback";

interface FeedbackFormProps {
  enrollmentId: string;
  onSuccess?: () => void;
}

export function FeedbackForm({ enrollmentId, onSuccess }: FeedbackFormProps) {
  const { mutate: send, isPending, error } = useSendFeedback(enrollmentId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SendFeedbackInput>({
    resolver: zodResolver(sendFeedbackSchema),
    defaultValues: { content: "" },
  });

  const onSubmit = (data: SendFeedbackInput) => {
    send(data, {
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
      <h3 className="text-sm font-medium text-gray-200">Send feedback</h3>

      <div className="flex flex-col gap-1">
        <textarea
          id="feedback-content"
          rows={4}
          className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
          placeholder="Write your feedback…"
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
          {isPending ? "Sending…" : "Send feedback"}
        </button>
      </div>
    </form>
  );
}
