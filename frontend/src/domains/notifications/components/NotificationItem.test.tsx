import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NotificationItem } from "./NotificationItem";
import * as notificationsService from "../services/notifications.service";

function renderItem(overrides: Record<string, unknown> = {}) {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  const notification = {
    id: "n-1",
    type: "test",
    title: "Test Notification",
    body: "Some body text",
    data: {},
    read_at: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };

  render(
    <QueryClientProvider client={qc}>
      <NotificationItem notification={notification as any} />
    </QueryClientProvider>,
  );
}

describe("NotificationItem", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("has unread visual style when read_at === null", () => {
    renderItem({ read_at: null });
    // Unread indicator dot
    const dot = document.querySelector(".bg-red-500");
    expect(dot).toBeInTheDocument();
  });

  it("does not have unread indicator when read", () => {
    renderItem({ read_at: new Date().toISOString() });
    const dot = document.querySelector(".bg-red-500");
    expect(dot).not.toBeInTheDocument();
  });

  it("clicking fires useMarkRead mutation", async () => {
    const spy = vi
      .spyOn(notificationsService.notificationsService, "markRead")
      .mockResolvedValue({ id: "n-1", read_at: new Date().toISOString() });

    renderItem({ read_at: null });
    const user = userEvent.setup();

    await user.click(screen.getByText("Test Notification"));

    expect(spy).toHaveBeenCalledWith("n-1");
  });
});
