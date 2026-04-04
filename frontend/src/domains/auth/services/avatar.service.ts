import { apiClient } from "@/shared/lib/api-client";
import { uploadAvatar, deleteAvatar } from "@/shared/lib/storage";
import type { MeResponse } from "../types/auth.types";

export const avatarService = {
  /**
   * Upload avatar: resize on client, upload to storage (Supabase or local),
   * then send the resulting URL to the backend via PUT /me.
   */
  async upload(file: File): Promise<MeResponse> {
    const avatarUrl = await uploadAvatar(file);

    return apiClient<MeResponse>("/api/v1/auth/me", {
      method: "PUT",
      body: JSON.stringify({ avatar_url: avatarUrl }),
    });
  },

  /**
   * Remove avatar: delete from storage, then clear URL on backend.
   */
  async remove(currentUrl: string): Promise<MeResponse> {
    try {
      await deleteAvatar(currentUrl);
    } catch {
      // Non-critical — proceed with clearing the URL
    }

    return apiClient<MeResponse>("/api/v1/auth/me", {
      method: "PUT",
      body: JSON.stringify({ avatar_url: null }),
    });
  },
};
