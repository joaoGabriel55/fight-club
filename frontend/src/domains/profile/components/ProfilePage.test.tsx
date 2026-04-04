import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProfilePage } from "./ProfilePage";
import * as authService from "@/domains/auth/services/auth.service";
import * as avatarService from "@/domains/auth/services/avatar.service";
import type { MeResponse } from "@/domains/auth/types/auth.types";

// Mock TanStack Router
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock api-client
vi.mock("@/shared/lib/api-client", async () => {
  const actual = await vi.importActual("@/shared/lib/api-client");
  return {
    ...actual,
    isAuthenticated: () => true,
  };
});

const studentUser: MeResponse = {
  id: "u1",
  first_name: "Jane",
  last_name: "Doe",
  email: "jane@example.com",
  birth_date: "2000-01-15",
  profile_type: "student",
  avatar_url: null,
  student_profile: {
    weight_kg: "65",
    height_cm: "170",
    fight_experience: [
      {
        martial_art: "Boxing",
        experience_years: 3,
        belt_level: null,
        competition_level: "amateur",
      },
    ],
  },
  teacher_profile: null,
};

const studentWithBelt: MeResponse = {
  id: "u3",
  first_name: "Ana",
  last_name: "Silva",
  email: "ana@example.com",
  birth_date: "1998-03-10",
  profile_type: "student",
  avatar_url: null,
  student_profile: {
    weight_kg: "58",
    height_cm: "165",
    fight_experience: [
      {
        martial_art: "Brazilian Jiu-Jitsu (BJJ)",
        experience_years: 7,
        belt_level: "Purple",
        competition_level: "professional",
      },
    ],
  },
  teacher_profile: null,
};

const teacherUser: MeResponse = {
  id: "u2",
  first_name: "Mike",
  last_name: "Smith",
  email: "mike@example.com",
  birth_date: "1985-06-20",
  profile_type: "teacher",
  avatar_url: null,
  student_profile: null,
  teacher_profile: {
    fight_experience: [
      {
        martial_art: "Brazilian Jiu-Jitsu (BJJ)",
        experience_years: 15,
        belt_level: "Black",
        competition_level: "professional",
      },
    ],
  },
};

const emptyStudent: MeResponse = {
  id: "u4",
  first_name: "New",
  last_name: "Student",
  email: "new@example.com",
  birth_date: null,
  profile_type: "student",
  avatar_url: null,
  student_profile: {
    weight_kg: null,
    height_cm: null,
    fight_experience: null,
  },
  teacher_profile: null,
};

function renderPage(user: MeResponse) {
  vi.spyOn(authService.authService, "getMe").mockResolvedValue(user);

  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={qc}>
      <ProfilePage />
    </QueryClientProvider>,
  );
}

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ── Personal information ───────────────────────────────────────────────

  it("renders personal information fields for student", async () => {
    renderPage(studentUser);

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toHaveValue("Jane");
    });
    expect(screen.getByLabelText(/last name/i)).toHaveValue("Doe");
    // birth_date is rendered as a popover button, not an input — check it displays a date (locale-dependent format)
    const birthDateEl = screen.getByLabelText(/date of birth/i);
    expect(birthDateEl.textContent).not.toBe("Select date");
  });

  it("email field is disabled", async () => {
    renderPage(studentUser);

    await waitFor(() => {
      expect(screen.getByDisplayValue("jane@example.com")).toBeDisabled();
    });
  });

  // ── Student physical info ──────────────────────────────────────────────

  it("shows weight and height fields for student", async () => {
    renderPage(studentUser);

    await waitFor(() => {
      expect(screen.getByLabelText(/weight/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/height/i)).toBeInTheDocument();
  });

  it("does not show weight/height for teacher", async () => {
    renderPage(teacherUser);

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toHaveValue("Mike");
    });
    expect(screen.queryByLabelText(/weight/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/height/i)).not.toBeInTheDocument();
  });

  // ── Martial arts experience ────────────────────────────────────────────

  it("renders existing fight experience entries with years", async () => {
    renderPage(studentUser);

    await waitFor(() => {
      expect(screen.getByDisplayValue("3")).toBeInTheDocument();
    });
  });

  it("renders teacher fight experience", async () => {
    renderPage(teacherUser);

    await waitFor(() => {
      expect(screen.getByDisplayValue("15")).toBeInTheDocument();
    });
  });

  it("shows empty state when no disciplines added", async () => {
    renderPage(emptyStudent);

    await waitFor(() => {
      expect(screen.getByText(/no disciplines added yet/i)).toBeInTheDocument();
    });
  });

  it("can add a new martial art entry", async () => {
    renderPage(studentUser);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /add martial art/i }),
      ).toBeInTheDocument();
    });

    await userEvent.click(
      screen.getByRole("button", { name: /add martial art/i }),
    );

    // Should now have 2 year inputs
    const yearInputs = screen.getAllByRole("spinbutton");
    expect(yearInputs.length).toBeGreaterThanOrEqual(2);
  });

  it("can remove a martial art entry", async () => {
    renderPage(studentUser);

    await waitFor(() => {
      expect(screen.getByDisplayValue("3")).toBeInTheDocument();
    });

    // Click the delete button (has aria-label)
    const removeBtn = screen.getByRole("button", {
      name: /remove boxing entry/i,
    });
    await userEvent.click(removeBtn);

    expect(screen.queryByDisplayValue("3")).not.toBeInTheDocument();
  });

  // ── Belt level ─────────────────────────────────────────────────────────

  it("shows belt level selector for belt-based martial arts", async () => {
    renderPage(studentWithBelt);

    await waitFor(() => {
      expect(screen.getByDisplayValue("7")).toBeInTheDocument();
    });

    // Belt level label should be present for BJJ
    expect(screen.getByLabelText(/belt level/i)).toBeInTheDocument();
  });

  it("renders belt badge when belt level is set", async () => {
    renderPage(studentWithBelt);

    await waitFor(() => {
      expect(screen.getByText(/purple belt/i)).toBeInTheDocument();
    });
  });

  it("does not show belt level for non-belt martial arts", async () => {
    renderPage(studentUser); // Boxing — no belt system

    await waitFor(() => {
      expect(screen.getByDisplayValue("3")).toBeInTheDocument();
    });

    expect(screen.queryByLabelText(/belt level/i)).not.toBeInTheDocument();
  });

  // ── Competition level ──────────────────────────────────────────────────

  it("shows competition level selector for all martial arts", async () => {
    renderPage(studentUser);

    await waitFor(() => {
      expect(screen.getByDisplayValue("3")).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/competition level/i)).toBeInTheDocument();
  });

  // ── Form submission ────────────────────────────────────────────────────

  it("calls updateMe with belt_level and competition_level on submit", async () => {
    const updateSpy = vi
      .spyOn(authService.authService, "updateMe")
      .mockResolvedValue(studentWithBelt);

    renderPage(studentWithBelt);

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toHaveValue("Ana");
    });

    await userEvent.click(
      screen.getByRole("button", { name: /save profile/i }),
    );

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalled();
    });

    const payload = updateSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.first_name).toBe("Ana");

    const fightExp = payload.fight_experience as Array<Record<string, unknown>>;
    expect(fightExp).toHaveLength(1);
    expect(fightExp[0].martial_art).toBe("Brazilian Jiu-Jitsu (BJJ)");
    expect(fightExp[0].belt_level).toBe("Purple");
    expect(fightExp[0].competition_level).toBe("professional");
  });

  it("sends null for empty belt_level and competition_level", async () => {
    const userNoBelt: MeResponse = {
      ...studentUser,
      student_profile: {
        weight_kg: "65",
        height_cm: "170",
        fight_experience: [
          {
            martial_art: "Boxing",
            experience_years: 3,
            belt_level: null,
            competition_level: null,
          },
        ],
      },
    };

    const updateSpy = vi
      .spyOn(authService.authService, "updateMe")
      .mockResolvedValue(userNoBelt);

    renderPage(userNoBelt);

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toHaveValue("Jane");
    });

    await userEvent.click(
      screen.getByRole("button", { name: /save profile/i }),
    );

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalled();
    });

    const payload = updateSpy.mock.calls[0][0] as Record<string, unknown>;
    const fightExp = payload.fight_experience as Array<Record<string, unknown>>;
    expect(fightExp[0].belt_level).toBeNull();
    expect(fightExp[0].competition_level).toBeNull();
  });

  // ── Accessibility ──────────────────────────────────────────────────────

  it("has aria-live region for status messages", async () => {
    renderPage(studentUser);

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toHaveValue("Jane");
    });

    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
  });

  it("delete buttons have descriptive aria-labels", async () => {
    renderPage(studentUser);

    await waitFor(() => {
      expect(screen.getByDisplayValue("3")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /remove boxing entry/i }),
    ).toBeInTheDocument();
  });

  it("displays page header with correct role label", async () => {
    renderPage(studentUser);

    await waitFor(() => {
      expect(screen.getByText(/fighter profile/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/student/i)).toBeInTheDocument();
  });

  it("displays instructor label for teacher", async () => {
    renderPage(teacherUser);

    await waitFor(() => {
      expect(screen.getByText(/instructor/i)).toBeInTheDocument();
    });
  });

  // ── Avatar ─────────────────────────────────────────────────────────────

  it("shows upload photo button", async () => {
    renderPage(studentUser);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /upload photo/i }),
      ).toBeInTheDocument();
    });
  });

  it("shows avatar image when user has avatar_url", async () => {
    const userWithAvatar: MeResponse = {
      ...studentUser,
      avatar_url: "/uploads/avatars/test.jpg",
    };
    renderPage(userWithAvatar);

    await waitFor(() => {
      const img = screen.getByAltText(/jane's profile photo/i);
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "/uploads/avatars/test.jpg");
    });
  });

  it("shows fallback icon when no avatar", async () => {
    renderPage(studentUser);

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toHaveValue("Jane");
    });

    // No img with alt text should exist
    expect(
      screen.queryByAltText(/jane's profile photo/i),
    ).not.toBeInTheDocument();
  });

  it("shows remove button when avatar exists", async () => {
    const userWithAvatar: MeResponse = {
      ...studentUser,
      avatar_url: "/uploads/avatars/test.jpg",
    };
    renderPage(userWithAvatar);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /remove profile photo/i }),
      ).toBeInTheDocument();
    });
  });

  it("does not show remove button when no avatar", async () => {
    renderPage(studentUser);

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toHaveValue("Jane");
    });

    expect(
      screen.queryByRole("button", { name: /remove profile photo/i }),
    ).not.toBeInTheDocument();
  });

  it("calls avatar upload service when file is selected", async () => {
    const uploadSpy = vi
      .spyOn(avatarService.avatarService, "upload")
      .mockResolvedValue({
        avatar_url: "/uploads/avatars/new.jpg",
      } as MeResponse);

    renderPage(studentUser);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /upload photo/i }),
      ).toBeInTheDocument();
    });

    const file = new File(["fake-image"], "avatar.jpg", {
      type: "image/jpeg",
    });

    const input = screen.getByLabelText(
      /upload profile photo/i,
    ) as HTMLInputElement;
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(uploadSpy).toHaveBeenCalledWith(file);
    });
  });

  it("calls avatar remove service when remove button clicked", async () => {
    const removeSpy = vi
      .spyOn(avatarService.avatarService, "remove")
      .mockResolvedValue({ avatar_url: null } as unknown as MeResponse);

    const userWithAvatar: MeResponse = {
      ...studentUser,
      avatar_url: "/uploads/avatars/test.jpg",
    };
    renderPage(userWithAvatar);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /remove profile photo/i }),
      ).toBeInTheDocument();
    });

    await userEvent.click(
      screen.getByRole("button", { name: /remove profile photo/i }),
    );

    await waitFor(() => {
      expect(removeSpy).toHaveBeenCalled();
    });
  });
});
