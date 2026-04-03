import { useQuery } from "@tanstack/react-query";
import { feedbackService } from "../services/feedback.service";
import type { FeedbackItem } from "../types/feedback.types";

export function useFeedback(enrollmentId: string) {
  return useQuery<FeedbackItem[]>({
    queryKey: ["feedback", enrollmentId],
    queryFn: () => feedbackService.getEnrollmentFeedback(enrollmentId),
  });
}
