import { apiClient } from "@/shared/lib/api-client";
import type {
  Announcement,
  MyAnnouncement,
  CreateAnnouncementInput,
} from "../types/announcement.types";

export const announcementsService = {
  async getClassAnnouncements(classId: string): Promise<Announcement[]> {
    return apiClient<Announcement[]>(
      `/api/v1/classes/${classId}/announcements`,
    );
  },

  async getMyAnnouncements(): Promise<MyAnnouncement[]> {
    return apiClient<MyAnnouncement[]>("/api/v1/announcements");
  },

  async createAnnouncement(
    classId: string,
    data: CreateAnnouncementInput,
  ): Promise<Announcement> {
    return apiClient<Announcement>(`/api/v1/classes/${classId}/announcements`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async deleteAnnouncement(
    classId: string,
    announcementId: string,
  ): Promise<void> {
    await apiClient<void>(
      `/api/v1/classes/${classId}/announcements/${announcementId}`,
      { method: "DELETE" },
    );
  },
};
