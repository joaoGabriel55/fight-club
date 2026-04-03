import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BeltTimeline } from "./BeltTimeline";
import type { BeltProgress } from "../types/belt.types";

function renderTimeline(belts: BeltProgress[], isLoading = false) {
  const qc = new QueryClient();
  render(
    <QueryClientProvider client={qc}>
      <BeltTimeline belts={belts} isLoading={isLoading} />
    </QueryClientProvider>,
  );
}

describe("BeltTimeline", () => {
  it("renders all belts in order", () => {
    const belts: BeltProgress[] = [
      {
        id: "1",
        belt_name: "White",
        awarded_at: "2024-01-01",
        awarded_by: { first_name: "Sensei" },
      },
      {
        id: "2",
        belt_name: "Blue",
        awarded_at: "2024-06-01",
        awarded_by: { first_name: "Sensei" },
      },
    ];

    renderTimeline(belts);

    expect(screen.getByText("White")).toBeInTheDocument();
    expect(screen.getByText("Blue")).toBeInTheDocument();
  });

  it('empty state shows "No belts awarded yet"', () => {
    renderTimeline([]);
    expect(screen.getByText("No belts awarded yet")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    renderTimeline([], true);
    expect(screen.getByText(/loading belt history/i)).toBeInTheDocument();
  });
});
