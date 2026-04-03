import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FeedbackForm } from "./FeedbackForm";
import * as feedbackService from "../services/feedback.service";

function renderForm() {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={qc}>
      <FeedbackForm enrollmentId="enr-1" />
    </QueryClientProvider>,
  );
}

describe("FeedbackForm", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("empty content → shows validation error", async () => {
    renderForm();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /send feedback/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/feedback must be at least 10 characters/i),
      ).toBeInTheDocument();
    });
  });

  it("valid form calls useSendFeedback mutation", async () => {
    const spy = vi
      .spyOn(feedbackService.feedbackService, "sendFeedback")
      .mockResolvedValue({
        id: "fb-1",
        content: "Great progress on your guard!",
        teacher: { first_name: "Alice" },
        created_at: new Date().toISOString(),
      });

    renderForm();
    const user = userEvent.setup();

    await user.type(
      screen.getByPlaceholderText(/write your feedback/i),
      "Great progress on your guard!",
    );
    await user.click(screen.getByRole("button", { name: /send feedback/i }));

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith("enr-1", {
        content: "Great progress on your guard!",
      });
    });
  });
});
