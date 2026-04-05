import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NotificationPanel } from "./NotificationPanel";
import * as notificationsService from "../services/notifications.service";
import type { NotificationItem } from "../types/notification.types";

function renderPanel(props: {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading?: boolean;
}) {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={qc}>
      <NotificationPanel
        notifications={props.notifications}
        unreadCount={props.unreadCount}
        isLoading={props.isLoading ?? false}
      />
    </QueryClientProvider>,
  );
}

const mockNotifications: NotificationItem[] = [
  {
    id: "1",
    type: "announcement_created",
    title: "New Announcement",
    body: "Check out the latest update",
    data: {},
    read_at: null,
    created_at: "2026-01-01T10:00:00.000Z",
  },
  {
    id: "2",
    type: "feedback_received",
    title: "Feedback Received",
    body: "Your teacher left feedback",
    data: {},
    read_at: "2026-01-01T11:00:00.000Z",
    created_at: "2026-01-01T09:00:00.000Z",
  },
];

describe("NotificationPanel", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("renders list of notifications", () => {
    renderPanel({ notifications: mockNotifications, unreadCount: 1 });

    expect(screen.getByText("New Announcement")).toBeInTheDocument();
    expect(screen.getByText("Feedback Received")).toBeInTheDocument();
    expect(screen.getByText("Check out the latest update")).toBeInTheDocument();
  });

  it("shows empty state when no notifications", () => {
    renderPanel({ notifications: [], unreadCount: 0 });

    expect(screen.getByText("No notifications")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    renderPanel({ notifications: [], unreadCount: 0, isLoading: true });

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("No notifications")).not.toBeInTheDocument();
  });

  it("shows mark all read button when there are unread notifications", () => {
    renderPanel({ notifications: mockNotifications, unreadCount: 1 });

    expect(screen.getByText("Mark all read")).toBeInTheDocument();
  });

  it("hides mark all read button when unread count is 0", () => {
    renderPanel({ notifications: mockNotifications, unreadCount: 0 });

    expect(screen.queryByText("Mark all read")).not.toBeInTheDocument();
  });

  it("calls markAllRead when mark all read button is clicked", async () => {
    const markAllReadSpy = vi
      .spyOn(notificationsService.notificationsService, "markAllRead")
      .mockResolvedValue({ updated: 1 });

    renderPanel({ notifications: mockNotifications, unreadCount: 1 });

    await userEvent.click(screen.getByText("Mark all read"));

    expect(markAllReadSpy).toHaveBeenCalled();
  });

  it("renders the Notifications heading", () => {
    renderPanel({ notifications: [], unreadCount: 0 });

    expect(screen.getByText("Notifications")).toBeInTheDocument();
  });
});
