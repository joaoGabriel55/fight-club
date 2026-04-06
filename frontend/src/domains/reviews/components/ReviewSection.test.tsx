import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReviewSection } from "./ReviewSection";
import * as useMyReviews from "../hooks/useMyReviews";

vi.mock("../hooks/useMyReviews", () => ({
  useMyReviews: vi.fn(),
}));

function renderSection(
  schedules?: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
  }>,
) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={qc}>
      <ReviewSection
        classId="class-1"
        className="Test Class"
        schedules={schedules}
      />
    </QueryClientProvider>,
  );
}

describe("ReviewSection", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows rate button when class session has ended today", async () => {
    vi.mocked(useMyReviews.useMyReviews).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    const today = new Date().getDay();
    renderSection([
      { day_of_week: today, start_time: "00:00", end_time: "00:01" },
    ]);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /rate today's class/i }),
      ).toBeInTheDocument();
    });
  });

  it("shows nothing when schedules is empty array", async () => {
    vi.mocked(useMyReviews.useMyReviews).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    renderSection([]);

    await waitFor(() => {
      expect(
        screen.queryByText(/reviews available after class ends/i),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /rate today's class/i }),
      ).not.toBeInTheDocument();
    });
  });

  it("shows existing review instead of rate button", async () => {
    const today = new Date().toISOString().split("T")[0];
    vi.mocked(useMyReviews.useMyReviews).mockReturnValue({
      data: [
        {
          id: "review-1",
          rating: 4,
          comment: "Great class!",
          session_date: today,
          created_at: new Date().toISOString(),
        },
      ],
      isLoading: false,
    } as any);

    const todayDay = new Date().getDay();
    renderSection([
      { day_of_week: todayDay, start_time: "00:00", end_time: "00:01" },
    ]);

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /rate today's class/i }),
      ).not.toBeInTheDocument();
      expect(screen.getAllByText(/great class/i).length).toBeGreaterThan(0);
    });
  });

  it("shows loading state", () => {
    vi.mocked(useMyReviews.useMyReviews).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any);

    renderSection();

    expect(screen.getByText(/loading reviews/i)).toBeInTheDocument();
  });
});
