import { apiClient } from "@/shared/lib/api-client";
import type { NotificationsResponse } from "../types/notification.types";

export const notificationsService = {
  async getNotifications(): Promise<NotificationsResponse> {
    return apiClient<NotificationsResponse>("/api/v1/notifications");
  },

  async markRead(id: string): Promise<{ id: string; read_at: string }> {
    return apiClient<{ id: string; read_at: string }>(
      `/api/v1/notifications/${id}/read`,
      { method: "PUT" },
    );
  },

  async markAllRead(): Promise<{ updated: number }> {
    return apiClient<{ updated: number }>("/api/v1/notifications/read-all", {
      method: "PUT",
    });
  },
};
