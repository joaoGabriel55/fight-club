import { useMutation, useQueryClient } from "@tanstack/react-query";
import { feedbackService } from "../services/feedback.service";
import type { FeedbackItem, SendFeedbackInput } from "../types/feedback.types";
import { ApiError } from "@/shared/lib/api-client";

export function useSendFeedback(enrollmentId: string) {
  const queryClient = useQueryClient();

  return useMutation<FeedbackItem, ApiError, SendFeedbackInput>({
    mutationFn: (data) => feedbackService.sendFeedback(enrollmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["feedback", enrollmentId],
      });
    },
  });
}
