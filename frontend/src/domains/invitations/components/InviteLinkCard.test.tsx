import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { InviteLinkCard } from "./InviteLinkCard";
import * as invitationsService from "../services/invitations.service";
import type { Invitation } from "../types/invitation.types";

const mockInvitation: Invitation = {
  id: "inv-1",
  token: "abc-token-uuid",
  invite_url: "http://localhost:3000/join/abc-token-uuid",
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  max_uses: null,
  use_count: 2,
};

function renderCard(invitation: Invitation = mockInvitation) {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={qc}>
      <InviteLinkCard invitation={invitation} classId="class-1" />
    </QueryClientProvider>,
  );
}

describe("InviteLinkCard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("renders the invite URL", () => {
    renderCard();
    expect(
      screen.getByText("http://localhost:3000/join/abc-token-uuid"),
    ).toBeInTheDocument();
  });

  it("'Copy link' button calls navigator.clipboard.writeText with the correct URL", async () => {
    renderCard();
    await userEvent.click(screen.getByRole("button", { name: /copy link/i }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "http://localhost:3000/join/abc-token-uuid",
    );
  });

  it("shows 'Copied!' feedback after copying", async () => {
    renderCard();
    await userEvent.click(screen.getByRole("button", { name: /copy link/i }));
    expect(
      screen.getByRole("button", { name: /copied!/i }),
    ).toBeInTheDocument();
  });

  it("shows use count when max_uses is null", () => {
    renderCard();
    expect(screen.getByText(/2 uses/i)).toBeInTheDocument();
  });

  it("shows uses left when max_uses is set", () => {
    renderCard({ ...mockInvitation, max_uses: 5, use_count: 3 });
    expect(screen.getByText(/2 use.*left/i)).toBeInTheDocument();
  });

  it("clicking Revoke then confirming calls revokeInvitation", async () => {
    const spy = vi
      .spyOn(invitationsService.invitationsService, "revokeInvitation")
      .mockResolvedValue(undefined);

    renderCard();
    await userEvent.click(screen.getByRole("button", { name: /revoke/i }));
    await userEvent.click(screen.getByRole("button", { name: /yes, revoke/i }));
    expect(spy).toHaveBeenCalledWith("inv-1");
  });
});
