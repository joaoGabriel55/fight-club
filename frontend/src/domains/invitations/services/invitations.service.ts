import { apiClient } from "@/shared/lib/api-client";
import type {
  Invitation,
  CreateInvitationInput,
  CreateInvitationResponse,
} from "../types/invitation.types";

export const invitationsService = {
  async createInvitation(
    classId: string,
    data: CreateInvitationInput,
  ): Promise<CreateInvitationResponse> {
    return apiClient<CreateInvitationResponse>(
      `/api/v1/classes/${classId}/invitations`,
      { method: "POST", body: JSON.stringify(data) },
    );
  },

  async listInvitations(classId: string): Promise<Invitation[]> {
    return apiClient<Invitation[]>(`/api/v1/classes/${classId}/invitations`);
  },

  async revokeInvitation(invitationId: string): Promise<void> {
    await apiClient<void>(`/api/v1/invitations/${invitationId}`, {
      method: "DELETE",
    });
  },
};
