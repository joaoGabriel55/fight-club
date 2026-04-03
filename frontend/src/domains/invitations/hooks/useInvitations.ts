import { useQuery } from "@tanstack/react-query";
import { invitationsService } from "../services/invitations.service";
import type { Invitation } from "../types/invitation.types";

export function useInvitations(classId: string) {
  return useQuery<Invitation[]>({
    queryKey: ["invitations", classId],
    queryFn: () => invitationsService.listInvitations(classId),
  });
}
