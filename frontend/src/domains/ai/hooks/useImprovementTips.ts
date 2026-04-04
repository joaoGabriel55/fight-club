import { useMutation } from "@tanstack/react-query";
import { aiService } from "../services/ai.service";
import type { ImprovementTipsRequest } from "../types/ai.types";

export function useImprovementTips() {
  return useMutation({
    mutationFn: (data: ImprovementTipsRequest) =>
      aiService.getImprovementTips(data),
  });
}
