import { useMutation, useQueryClient } from "@tanstack/react-query";
import { announcementsService } from "../services/announcements.service";
import { ApiError } from "@/shared/lib/api-client";

export function useDeleteAnnouncement(classId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (announcementId) =>
      announcementsService.deleteAnnouncement(classId, announcementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements", classId] });
    },
  });
}
