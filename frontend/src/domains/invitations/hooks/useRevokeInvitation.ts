import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invitationsService } from "../services/invitations.service";
import { ApiError } from "@/shared/lib/api-client";

export function useRevokeInvitation(classId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (invitationId) =>
      invitationsService.revokeInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations", classId] });
    },
  });
}
