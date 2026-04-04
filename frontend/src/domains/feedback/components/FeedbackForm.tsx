import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  sendFeedbackSchema,
  type SendFeedbackInput,
} from "../schemas/feedback.schema";
import { useSendFeedback } from "../hooks/useSendFeedback";
import { Textarea } from "@/shared/components/ui/textarea";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Send feedback</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-3"
          noValidate
        >
          <div className="flex flex-col gap-1">
            <Textarea
              id="feedback-content"
              rows={4}
              placeholder="Write your feedback..."
              {...register("content")}
            />
            {errors.content && (
              <p className="text-sm text-destructive">
                {errors.content.message}
              </p>
            )}
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error.message}
            </p>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending} size="sm">
              {isPending ? "Sending..." : "Send feedback"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
