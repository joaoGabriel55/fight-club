import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnnouncementCard } from "./AnnouncementCard";
import type { Announcement } from "../types/announcement.types";

const mockAnnouncement: Announcement = {
  id: "ann-1",
  title: "Class cancelled this week",
  content:
    "Due to the tournament, there will be no classes this week. See you next Monday! This is a longer message to test truncation in the card view.",
  author: { first_name: "Alice" },
  created_at: new Date().toISOString(),
};

function renderCard(
  overrides: Partial<Parameters<typeof AnnouncementCard>[0]> = {},
) {
  const props = {
    announcement: mockAnnouncement,
    isTeacher: false,
    onDelete: vi.fn(),
    isDeleting: false,
    ...overrides,
  };
  render(<AnnouncementCard {...props} />);
  return props;
}

describe("AnnouncementCard", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("shows title and truncated content", () => {
    renderCard();
    expect(screen.getByText("Class cancelled this week")).toBeInTheDocument();
    expect(screen.getByText(/Due to the tournament/)).toBeInTheDocument();
  });

  it("shows author name and date", () => {
    renderCard();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("teacher role shows Delete button", () => {
    renderCard({ isTeacher: true });
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });

  it("student role does not show Delete button", () => {
    renderCard({ isTeacher: false });
    expect(screen.queryByRole("button", { name: /delete/i })).toBeNull();
  });

  it("clicking Delete then confirming calls onDelete", async () => {
    const { onDelete } = renderCard({ isTeacher: true });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /delete/i }));
    await user.click(screen.getByRole("button", { name: /yes, delete/i }));

    expect(onDelete).toHaveBeenCalledWith("ann-1");
  });
});
