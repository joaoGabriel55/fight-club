export interface Invitation {
  id: string;
  token: string;
  invite_url: string;
  expires_at: string;
  max_uses: number | null;
  use_count: number;
}

export interface CreateInvitationInput {
  expires_at: string;
  max_uses?: number | null;
}

export interface CreateInvitationResponse {
  id: string;
  token: string;
  invite_url: string;
  expires_at: string;
  max_uses: number | null;
}
