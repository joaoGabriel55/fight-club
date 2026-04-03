import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginForm } from "./LoginForm";
import * as apiClient from "@/shared/lib/api-client";
import * as authService from "../services/auth.service";

// Mock TanStack Router navigation so we can test without a full router
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderForm() {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <LoginForm />
    </QueryClientProvider>,
  );
}

describe("LoginForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockNavigate.mockClear();
  });

  it("shows 'Email is required' when email is empty on submit", async () => {
    renderForm();
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });

  it("shows format error when email is invalid", async () => {
    renderForm();
    await userEvent.type(screen.getByLabelText(/email/i), "not-an-email");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  it("does not call the API when validation fails", async () => {
    const spy = vi.spyOn(authService.authService, "login");
    renderForm();
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
    expect(spy).not.toHaveBeenCalled();
  });

  it("calls setToken and navigates to /dashboard on success", async () => {
    vi.spyOn(authService.authService, "login").mockResolvedValue({
      token: "opaque-token-xyz",
      user: { id: "u1", first_name: "Alice", profile_type: "student" },
    });
    const setTokenSpy = vi.spyOn(apiClient, "setToken");

    renderForm();
    await userEvent.type(screen.getByLabelText(/email/i), "alice@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "password123");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(setTokenSpy).toHaveBeenCalledWith("opaque-token-xyz");
    });
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/dashboard",
      reloadDocument: true,
    });
  });
});
