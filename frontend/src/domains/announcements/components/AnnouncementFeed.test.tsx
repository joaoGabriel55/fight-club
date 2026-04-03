import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnnouncementFeed } from "./AnnouncementFeed";
import * as announcementsService from "../services/announcements.service";

function renderFeed(isTeacher = false) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={qc}>
      <AnnouncementFeed classId="class-1" isTeacher={isTeacher} />
    </QueryClientProvider>,
  );
}

describe("AnnouncementFeed", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("shows 'No announcements yet' when list is empty", async () => {
    vi.spyOn(
      announcementsService.announcementsService,
      "getClassAnnouncements",
    ).mockResolvedValue([]);

    renderFeed();

    expect(
      await screen.findByText(/no announcements yet/i),
    ).toBeInTheDocument();
  });

  it("teacher sees '+ New announcement' button", async () => {
    vi.spyOn(
      announcementsService.announcementsService,
      "getClassAnnouncements",
    ).mockResolvedValue([]);

    renderFeed(true);

    expect(
      await screen.findByRole("button", { name: /new announcement/i }),
    ).toBeInTheDocument();
  });

  it("student does not see '+ New announcement' button", async () => {
    vi.spyOn(
      announcementsService.announcementsService,
      "getClassAnnouncements",
    ).mockResolvedValue([]);

    renderFeed(false);

    await screen.findByText(/no announcements yet/i);
    expect(
      screen.queryByRole("button", { name: /new announcement/i }),
    ).toBeNull();
  });
});
