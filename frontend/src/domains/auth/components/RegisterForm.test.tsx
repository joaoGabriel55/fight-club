import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RegisterForm } from "./RegisterForm";

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

function renderForm() {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <RegisterForm />
    </QueryClientProvider>,
  );
}

describe("RegisterForm — profile_type selector", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("shows student description by default (student radio pre-selected)", async () => {
    renderForm();
    expect(
      screen.getByText(/track your weight, height, and training data/i),
    ).toBeInTheDocument();
  });

  it("shows teacher description when teacher radio is selected", async () => {
    renderForm();
    await userEvent.click(screen.getByLabelText(/teacher/i));
    await waitFor(() => {
      expect(
        screen.getByText(/create and manage classes/i),
      ).toBeInTheDocument();
    });
  });

  it("hides teacher description when student is re-selected", async () => {
    renderForm();
    await userEvent.click(screen.getByLabelText(/teacher/i));
    await userEvent.click(screen.getByLabelText(/student/i));
    await waitFor(() => {
      expect(
        screen.queryByText(/create and manage classes/i),
      ).not.toBeInTheDocument();
    });
  });
});
