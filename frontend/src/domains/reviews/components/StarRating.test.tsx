import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StarRating } from "./StarRating";

function renderStarRating(value: number = 0, readonly: boolean = false) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const onChange = vi.fn();
  render(
    <QueryClientProvider client={qc}>
      <StarRating value={value} onChange={onChange} readonly={readonly} />
    </QueryClientProvider>,
  );
  return { onChange };
}

describe("StarRating", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("renders 5 stars", () => {
    renderStarRating(0);
    const stars = screen.getAllByRole("button");
    expect(stars).toHaveLength(5);
  });

  it("displays filled stars for given value", () => {
    renderStarRating(3);
    const stars = screen.getAllByRole("button");
    const filledStars = stars.slice(0, 3);
    const emptyStars = stars.slice(3);

    filledStars.forEach((star) => {
      expect(star.querySelector(".fill-yellow-400")).toBeInTheDocument();
    });
    emptyStars.forEach((star) => {
      expect(star.querySelector(".fill-muted")).toBeInTheDocument();
    });
  });

  it("click changes value when not readonly", async () => {
    const { onChange } = renderStarRating(0);
    const user = userEvent.setup();
    const stars = screen.getAllByRole("button");

    await user.click(stars[2]);

    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("does not change value when readonly", async () => {
    const { onChange } = renderStarRating(2, true);
    const user = userEvent.setup();
    const stars = screen.getAllByRole("button");

    await user.click(stars[3]);

    expect(onChange).not.toHaveBeenCalled();
  });
});
