import { apiClient } from "@/shared/lib/api-client";

export interface DataExport {
  account: {
    first_name: string;
    last_name: string;
    email: string;
    profile_type: string;
    created_at: string;
  };
  enrollments: Array<{
    class_name: string;
    joined_at: string;
    status: string;
  }>;
  feedback_received: Array<{
    content: string;
    created_at: string;
    class_name: string;
  }>;
  belt_progress: Array<{
    belt_name: string;
    awarded_at: string;
    class_name: string;
  }>;
  announcements_received: Array<{
    title: string;
    content: string;
    class_name: string;
    created_at: string;
  }>;
}

export const privacyService = {
  async exportMyData(): Promise<DataExport> {
    return apiClient<DataExport>("/api/v1/privacy/my-data");
  },

  async eraseMyData(): Promise<void> {
    await apiClient<void>("/api/v1/privacy/my-data", { method: "DELETE" });
  },

  async getPrivacyPolicy(): Promise<{ content: string }> {
    return apiClient<{ content: string }>("/api/v1/privacy/policy", {
      unauthenticated: true,
    });
  },
};
