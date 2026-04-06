import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as classesHooks from "@/domains/classes/hooks/useClass";
import * as classStudentsHooks from "@/domains/classes/hooks/useClassStudents";
import * as feedbackHooks from "@/domains/feedback/hooks/useFeedback";
import * as beltsHooks from "@/domains/belts/hooks/useBelts";
import * as mediaQueryHooks from "@/shared/hooks/use-media-query";
import { StudentDetailDrawer } from "./StudentDetailDrawer";

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

const mockClass = {
  id: "class-1",
  name: "BJJ Basics",
  martial_art: "BJJ",
  has_belt_system: true,
  teacher_first_name: "Alice",
};

const mockStudent = {
  id: "student-1",
  first_name: "Bob",
  enrollment_id: "enroll-1",
  enrolled_at: "2025-01-01T00:00:00.000Z",
  weight_kg: 70,
  height_cm: 175,
  belt_level: "Blue",
  fight_experience: [
    { martial_art: "Judo", experience_years: 2, belt_level: "Green" },
  ],
};

const mockFeedback = [
  {
    id: "fb-1",
    content: "Great progress!",
    teacher: { first_name: "Alice" },
    created_at: "2025-01-15T10:00:00Z",
  },
];

const mockBelts = [
  { id: "belt-1", belt_name: "Blue", awarded_at: "2025-01-01T00:00:00Z", awarded_by: { first_name: "Alice" } },
];

describe("StudentDetailDrawer", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(mediaQueryHooks, "useMediaQuery").mockReturnValue(true);
    vi.spyOn(classesHooks, "useClass").mockReturnValue({
      data: mockClass,
      isLoading: false,
      isError: false,
      error: null,
    } as any);
    vi.spyOn(classStudentsHooks, "useStudentProfile").mockReturnValue({
      data: mockStudent,
      isLoading: false,
      isError: false,
      error: null,
    } as any);
    vi.spyOn(feedbackHooks, "useFeedback").mockReturnValue({
      data: mockFeedback,
      isLoading: false,
      isError: false,
      error: null,
    } as any);
    vi.spyOn(beltsHooks, "useBelts").mockReturnValue({
      data: mockBelts,
      isLoading: false,
      isError: false,
      error: null,
    } as any);
  });

  it("renders student name in title", async () => {
    render(
      createElement(makeWrapper(), null,
        createElement(StudentDetailDrawer, {
          classId: "class-1",
          studentId: "student-1",
          open: true,
          onClose: vi.fn(),
        })
      )
    );

    await waitFor(() => {
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });
  });

  it("displays enrollment date", async () => {
    render(
      createElement(makeWrapper(), null,
        createElement(StudentDetailDrawer, {
          classId: "class-1",
          studentId: "student-1",
          open: true,
          onClose: vi.fn(),
        })
      )
    );

    await waitFor(() => {
      expect(screen.getByText(/enrolled/i)).toBeInTheDocument();
    });
  });

  it("displays weight when present", async () => {
    render(
      createElement(makeWrapper(), null,
        createElement(StudentDetailDrawer, {
          classId: "class-1",
          studentId: "student-1",
          open: true,
          onClose: vi.fn(),
        })
      )
    );

    await waitFor(() => {
      expect(screen.getByText(/weight/i)).toBeInTheDocument();
      expect(screen.getByText("70 kg")).toBeInTheDocument();
    });
  });

  it("displays height when present", async () => {
    render(
      createElement(makeWrapper(), null,
        createElement(StudentDetailDrawer, {
          classId: "class-1",
          studentId: "student-1",
          open: true,
          onClose: vi.fn(),
        })
      )
    );

    await waitFor(() => {
      expect(screen.getByText(/height/i)).toBeInTheDocument();
      expect(screen.getByText("175 cm")).toBeInTheDocument();
    });
  });

  it("shows loading state", () => {
    vi.spyOn(classStudentsHooks, "useStudentProfile").mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as any);

    render(
      createElement(makeWrapper(), null,
        createElement(StudentDetailDrawer, {
          classId: "class-1",
          studentId: "student-1",
          open: true,
          onClose: vi.fn(),
        })
      )
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("shows not found when student is null", () => {
    vi.spyOn(classStudentsHooks, "useStudentProfile").mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(
      createElement(makeWrapper(), null,
        createElement(StudentDetailDrawer, {
          classId: "class-1",
          studentId: "student-1",
          open: true,
          onClose: vi.fn(),
        })
      )
    );

    expect(screen.getByText(/not found/i)).toBeInTheDocument();
  });
});
