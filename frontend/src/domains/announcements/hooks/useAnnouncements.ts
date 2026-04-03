import { useQuery } from "@tanstack/react-query";
import { announcementsService } from "../services/announcements.service";
import type { Announcement } from "../types/announcement.types";

export function useAnnouncements(classId: string) {
  return useQuery<Announcement[]>({
    queryKey: ["announcements", classId],
    queryFn: () => announcementsService.getClassAnnouncements(classId),
  });
}
