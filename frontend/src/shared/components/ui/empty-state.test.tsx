import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { EmptyState } from "./empty-state";
import { Inbox } from "lucide-react";

describe("EmptyState", () => {
  it("renders message", () => {
    render(<EmptyState message="No items found" />);
    expect(screen.getByText("No items found")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<EmptyState message="No items" description="Try creating one." />);
    expect(screen.getByText("Try creating one.")).toBeInTheDocument();
  });

  it("renders icon when provided", () => {
    const { container } = render(<EmptyState icon={Inbox} message="Empty" />);
    // Lucide renders an SVG
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders CTA button when action is provided", () => {
    render(<EmptyState message="No items" action={<button>Create</button>} />);
    expect(screen.getByText("Create")).toBeInTheDocument();
  });
});
