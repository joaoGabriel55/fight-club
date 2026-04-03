import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { ConsentCheckbox } from "./ConsentCheckbox";

function CheckboxForm({ error }: { error?: string }) {
  const { register } = useForm<{ consent: boolean }>();
  return (
    <form>
      <ConsentCheckbox registration={register("consent")} error={error} />
    </form>
  );
}

describe("ConsentCheckbox", () => {
  it("is unchecked by default", () => {
    render(<CheckboxForm />);
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("renders an error message when provided", () => {
    render(<CheckboxForm error="You must accept the terms" />);
    expect(screen.getByText("You must accept the terms")).toBeInTheDocument();
  });

  it("does not render an error message when none is provided", () => {
    render(<CheckboxForm />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
