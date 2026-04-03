import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NotificationBell } from "./NotificationBell";
import * as notificationsService from "../services/notifications.service";

function renderBell() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={qc}>
      <NotificationBell />
    </QueryClientProvider>,
  );
}

describe("NotificationBell", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("shows badge with count when unread_count > 0", async () => {
    vi.spyOn(
      notificationsService.notificationsService,
      "getNotifications",
    ).mockResolvedValue({
      data: [
        {
          id: "1",
          type: "test",
          title: "Test",
          body: null,
          data: {},
          read_at: null,
          created_at: new Date().toISOString(),
        },
        {
          id: "2",
          type: "test",
          title: "Test 2",
          body: null,
          data: {},
          read_at: null,
          created_at: new Date().toISOString(),
        },
      ],
      meta: { unread_count: 2 },
    });

    renderBell();

    const badge = await screen.findByText("2");
    expect(badge).toBeInTheDocument();
  });

  it("no badge when unread_count is 0", async () => {
    vi.spyOn(
      notificationsService.notificationsService,
      "getNotifications",
    ).mockResolvedValue({
      data: [],
      meta: { unread_count: 0 },
    });

    renderBell();

    // Wait for query to resolve
    await screen.findByLabelText("Notifications");

    // Should not have a count badge
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });
});
