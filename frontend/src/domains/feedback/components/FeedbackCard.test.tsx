import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeedbackCard } from "./FeedbackCard";
import type { FeedbackItem } from "../types/feedback.types";

const mockFeedback: FeedbackItem = {
  id: "fb-1",
  content: "Great progress on your technique!",
  teacher: { first_name: "Alice" },
  created_at: "2026-01-15T10:00:00.000Z",
};

describe("FeedbackCard", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("renders feedback content and teacher name", () => {
    render(<FeedbackCard feedback={mockFeedback} />);

    expect(
      screen.getByText("Great progress on your technique!"),
    ).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("renders formatted date", () => {
    render(<FeedbackCard feedback={mockFeedback} />);

    expect(screen.getByText("Jan 15, 2026")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <FeedbackCard feedback={mockFeedback} className="custom-class" />,
    );

    expect(container.querySelector(".custom-class")).toBeInTheDocument();
  });
});
