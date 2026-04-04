import { apiClient } from "@/shared/lib/api-client";
import type {
  ImprovementTipsRequest,
  ImprovementTipsResponse,
} from "../types/ai.types";

export const aiService = {
  async getImprovementTips(
    data: ImprovementTipsRequest,
  ): Promise<ImprovementTipsResponse> {
    return apiClient<ImprovementTipsResponse>("/api/v1/ai/improvement-tips", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
