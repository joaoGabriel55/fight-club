import { useQuery } from "@tanstack/react-query";
import { feedbackService } from "../services/feedback.service";
import type { MyFeedbackItem } from "../types/feedback.types";

export function useMyFeedback() {
  return useQuery<MyFeedbackItem[]>({
    queryKey: ["my-feedback"],
    queryFn: feedbackService.getMyFeedback,
  });
}
