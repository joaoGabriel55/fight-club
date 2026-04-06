import { apiClient } from "@/shared/lib/api-client";
import type {
  ImprovementTipsRequest,
  ImprovementTipsResponse,
  ClassTipsRequest,
  ClassTipsResponse,
} from "../types/ai.types";

export const aiService = {
  async getImprovementTips(
    data: ImprovementTipsRequest,
    signal?: AbortSignal,
  ): Promise<ImprovementTipsResponse> {
    return apiClient<ImprovementTipsResponse>("/api/v1/ai/improvement-tips", {
      method: "POST",
      body: JSON.stringify(data),
      signal,
    });
  },

  async requestClassTips(
    data: ClassTipsRequest,
    signal?: AbortSignal,
  ): Promise<ClassTipsResponse> {
    return apiClient<ClassTipsResponse>("/api/v1/ai/class-tips", {
      method: "POST",
      body: JSON.stringify(data),
      signal,
    });
  },
};
