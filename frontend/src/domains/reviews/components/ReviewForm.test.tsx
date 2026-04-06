import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReviewForm } from "./ReviewForm";
import * as reviewsService from "../services/reviews.service";

function renderForm(existingReview?: {
  id: string;
  rating: number;
  comment: string | null;
  session_date: string;
}) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={qc}>
      <ReviewForm classId="class-1" existingReview={existingReview} />
    </QueryClientProvider>,
  );
}

describe("ReviewForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(reviewsService.reviewsService, "createReview").mockResolvedValue({
      id: "review-1",
      rating: 4,
      comment: "Great class!",
      session_date: "2026-04-05",
      created_at: "2026-04-05T10:00:00Z",
    });
  });

  it("renders star rating and submit button", () => {
    renderForm();
    expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: /submit review/i }),
    ).toBeInTheDocument();
  });

  it("shows validation error when rating is 0", async () => {
    renderForm();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /submit review/i }));

    await waitFor(() => {
      expect(screen.getByText(/rating/i)).toBeInTheDocument();
    });
  });

  it("valid form calls createReview mutation", async () => {
    const spy = vi
      .spyOn(reviewsService.reviewsService, "createReview")
      .mockResolvedValue({
        id: "review-1",
        rating: 4,
        comment: "Great class!",
        session_date: "2026-04-05",
        created_at: "2026-04-05T10:00:00Z",
      });

    renderForm();
    const user = userEvent.setup();

    const stars = screen.getAllByRole("button");
    await user.click(stars[3]);

    await user.type(
      screen.getByPlaceholderText(/share your experience/i),
      "Great class!",
    );
    await user.click(screen.getByRole("button", { name: /submit review/i }));

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith("class-1", {
        rating: 4,
        comment: "Great class!",
        session_date: expect.any(String),
      });
    });
  });

  it("edit mode shows Update review button", () => {
    renderForm({
      id: "review-1",
      rating: 3,
      comment: "Was okay",
      session_date: "2026-04-04",
    });

    expect(
      screen.getByRole("button", { name: /update review/i }),
    ).toBeInTheDocument();
  });
});
