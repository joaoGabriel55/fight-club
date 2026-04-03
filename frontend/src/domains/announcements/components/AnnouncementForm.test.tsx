import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnnouncementForm } from "./AnnouncementForm";
import * as announcementsService from "../services/announcements.service";

function renderForm() {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={qc}>
      <AnnouncementForm classId="class-1" />
    </QueryClientProvider>,
  );
}

describe("AnnouncementForm", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("empty title → shows validation error", async () => {
    renderForm();
    const user = userEvent.setup();

    await user.click(
      screen.getByRole("button", { name: /post announcement/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/title must be at least 3 characters/i),
      ).toBeInTheDocument();
    });
  });

  it("content too short → shows validation error", async () => {
    renderForm();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/title/i), "Test Title");
    await user.type(screen.getByLabelText(/content/i), "Short");
    await user.click(
      screen.getByRole("button", { name: /post announcement/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/content must be at least 10 characters/i),
      ).toBeInTheDocument();
    });
  });

  it("valid form calls mutation with correct payload", async () => {
    const spy = vi
      .spyOn(announcementsService.announcementsService, "createAnnouncement")
      .mockResolvedValue({
        id: "ann-1",
        title: "Test Title",
        content: "This is a long enough content for the announcement.",
        author: { first_name: "Alice" },
        created_at: new Date().toISOString(),
      });

    renderForm();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/title/i), "Test Title");
    await user.type(
      screen.getByLabelText(/content/i),
      "This is a long enough content for the announcement.",
    );
    await user.click(
      screen.getByRole("button", { name: /post announcement/i }),
    );

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith("class-1", {
        title: "Test Title",
        content: "This is a long enough content for the announcement.",
      });
    });
  });
});
