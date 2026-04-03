import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ScheduleManager } from "./ScheduleManager";
import {
  createClassSchema,
  type CreateClassInput,
} from "../schemas/class.schema";

function Wrapper({ children }: { children: React.ReactNode }) {
  const methods = useForm<CreateClassInput>({
    resolver: zodResolver(createClassSchema),
    defaultValues: { schedules: [] },
  });
  return createElement(FormProvider, { ...methods }, children);
}

function renderScheduleManager() {
  return render(createElement(Wrapper, null, createElement(ScheduleManager)));
}

describe("ScheduleManager", () => {
  it("renders 'Add schedule' button", () => {
    renderScheduleManager();
    expect(screen.getByText("+ Add schedule")).toBeInTheDocument();
  });

  it("each row has day selector, start time, end time fields", async () => {
    const user = userEvent.setup();
    renderScheduleManager();

    await user.click(screen.getByText("+ Add schedule"));

    expect(screen.getByLabelText(/day/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end time/i)).toBeInTheDocument();
  });

  it("adding two schedules shows two rows", async () => {
    const user = userEvent.setup();
    renderScheduleManager();

    await user.click(screen.getByText("+ Add schedule"));
    await user.click(screen.getByText("+ Add schedule"));

    expect(screen.getByText("Schedule 1")).toBeInTheDocument();
    expect(screen.getByText("Schedule 2")).toBeInTheDocument();
  });

  it("shows day selector with all 7 days", async () => {
    const user = userEvent.setup();
    renderScheduleManager();

    await user.click(screen.getByText("+ Add schedule"));

    const select = screen.getByLabelText(/day/i) as HTMLSelectElement;
    expect(select.options.length).toBe(7);
  });
});
