import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { createRef } from "react";
import { Input } from "./input";

describe("Input", () => {
  it("renders with default props", () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe("INPUT");
  });

  it("forwards ref", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("applies custom className", () => {
    render(<Input className="custom-class" data-testid="input" />);
    const input = screen.getByTestId("input");
    expect(input.className).toContain("custom-class");
  });

  it("handles disabled state", () => {
    render(<Input disabled placeholder="Disabled" />);
    const input = screen.getByPlaceholderText("Disabled");
    expect(input).toBeDisabled();
  });

  it("accepts user input", async () => {
    const onChange = vi.fn();
    render(<Input placeholder="Type here" onChange={onChange} />);
    const input = screen.getByPlaceholderText("Type here");
    await userEvent.type(input, "hello");
    expect(onChange).toHaveBeenCalled();
    expect(input).toHaveValue("hello");
  });

  it("renders with specified type", () => {
    render(<Input type="password" data-testid="pw-input" />);
    const input = screen.getByTestId("pw-input");
    expect(input).toHaveAttribute("type", "password");
  });
});
