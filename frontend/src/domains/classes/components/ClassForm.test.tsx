import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
  createRootRoute,
} from "@tanstack/react-router";
import { ClassForm } from "./ClassForm";

function renderForm() {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  const rootRoute = createRootRoute({
    component: () => createElement(ClassForm),
  });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory(),
  });
  return render(
    createElement(
      QueryClientProvider,
      { client: qc },
      createElement(RouterProvider, { router }),
    ),
  );
}

describe("ClassForm — schedule field array", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("clicking '+ Add schedule' appends a new schedule row", async () => {
    const user = userEvent.setup();
    renderForm();

    const addBtn = await screen.findByText("+ Add schedule");
    await user.click(addBtn);

    expect(screen.getByText("Schedule 1")).toBeInTheDocument();
  });

  it("clicking 'Remove' removes the schedule row", async () => {
    const user = userEvent.setup();
    renderForm();

    const addBtn = await screen.findByText("+ Add schedule");
    await user.click(addBtn);
    expect(screen.getByText("Schedule 1")).toBeInTheDocument();

    await user.click(screen.getByText("Remove"));
    expect(screen.queryByText("Schedule 1")).not.toBeInTheDocument();
  });

  it("cannot submit with 0 schedules — shows inline error", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(await screen.findByLabelText(/class name/i), "My Class");
    await user.type(screen.getByLabelText(/martial art/i), "BJJ");

    await user.click(screen.getByRole("button", { name: /create class/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/at least one schedule is required/i),
      ).toBeInTheDocument();
    });
  });

  it("cannot submit with empty name — shows inline error", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(
      await screen.findByRole("button", { name: /create class/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/name must be at least 3 characters/i),
      ).toBeInTheDocument();
    });
  });
});
