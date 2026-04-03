import { useMutation, useQueryClient } from "@tanstack/react-query";
import { announcementsService } from "../services/announcements.service";
import type {
  Announcement,
  CreateAnnouncementInput,
} from "../types/announcement.types";
import { ApiError } from "@/shared/lib/api-client";

export function useCreateAnnouncement(classId: string) {
  const queryClient = useQueryClient();

  return useMutation<Announcement, ApiError, CreateAnnouncementInput>({
    mutationFn: (data) =>
      announcementsService.createAnnouncement(classId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements", classId] });
    },
  });
}
