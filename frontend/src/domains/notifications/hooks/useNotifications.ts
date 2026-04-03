import { useQuery } from "@tanstack/react-query";
import { notificationsService } from "../services/notifications.service";
import type { NotificationsResponse } from "../types/notification.types";

export function useNotifications() {
  return useQuery<NotificationsResponse>({
    queryKey: ["notifications"],
    queryFn: () => notificationsService.getNotifications(),
    refetchInterval: 60000,
  });
}
