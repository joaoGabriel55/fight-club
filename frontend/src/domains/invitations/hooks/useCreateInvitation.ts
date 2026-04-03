import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invitationsService } from "../services/invitations.service";
import type {
  CreateInvitationInput,
  CreateInvitationResponse,
} from "../types/invitation.types";
import { ApiError } from "@/shared/lib/api-client";

export function useCreateInvitation(classId: string) {
  const queryClient = useQueryClient();

  return useMutation<CreateInvitationResponse, ApiError, CreateInvitationInput>(
    {
      mutationFn: (data) => invitationsService.createInvitation(classId, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["invitations", classId] });
      },
    },
  );
}
