import { apiClient } from "@/shared/lib/api-client";
import type { BeltProgress, AwardBeltInput } from "../types/belt.types";

export const beltsService = {
  async getBelts(enrollmentId: string): Promise<BeltProgress[]> {
    return apiClient<BeltProgress[]>(
      `/api/v1/enrollments/${enrollmentId}/belts`,
    );
  },

  async awardBelt(
    enrollmentId: string,
    data: AwardBeltInput,
  ): Promise<BeltProgress> {
    return apiClient<BeltProgress>(
      `/api/v1/enrollments/${enrollmentId}/belts`,
      { method: "POST", body: JSON.stringify(data) },
    );
  },
};
