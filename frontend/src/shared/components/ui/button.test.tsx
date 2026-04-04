import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("fires onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    await userEvent.click(screen.getByText("Click"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("shows spinner and ignores click when isLoading=true", async () => {
    const onClick = vi.fn();
    render(
      <Button isLoading onClick={onClick}>
        Submit
      </Button>,
    );
    // Spinner should be rendered (role="status")
    expect(screen.getByRole("status")).toBeInTheDocument();
    // Button should be disabled
    expect(screen.getByRole("button")).toBeDisabled();
    // Click should not fire
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("is not disabled when isLoading=false", () => {
    render(<Button>Normal</Button>);
    expect(screen.getByRole("button")).not.toBeDisabled();
  });
});
