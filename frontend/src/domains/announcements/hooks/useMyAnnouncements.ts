import { useQuery } from "@tanstack/react-query";
import { announcementsService } from "../services/announcements.service";
import type { MyAnnouncement } from "../types/announcement.types";

export function useMyAnnouncements() {
  return useQuery<MyAnnouncement[]>({
    queryKey: ["my-announcements"],
    queryFn: announcementsService.getMyAnnouncements,
  });
}
