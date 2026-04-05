import { test, expect } from "@playwright/test";
import { API_URL, registerViaAPI, loginUI, fetchWithRetry } from "./helpers";

const ts = Date.now();

const TEACHER = {
  email: `teacher-enr-${ts}@test.com`,
  password: "Test1234!",
  first_name: "TeacherEnr",
  profile_type: "teacher" as const,
  birth_date: "1990-01-15",
};

const STUDENT = {
  email: `student-enr-${ts}@test.com`,
  password: "Test1234!",
  first_name: "StudentEnr",
  profile_type: "student" as const,
  birth_date: "2000-05-20",
};

let teacherToken: string;
let classId: string;
let inviteToken: string;

test.describe("Student Enrollment Flow", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    teacherToken = await registerViaAPI(TEACHER);

    // Create class via API
    const res = await fetchWithRetry(`${API_URL}/api/v1/classes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        name: "Enrollment E2E Class",
        martial_art: "Judo",
        has_belt_system: true,
        schedules: [{ day_of_week: 3, start_time: "17:00", end_time: "18:30" }],
      }),
    });
    const cls = await res.json();
    classId = cls.id;

    // Create invitation via API
    const invRes = await fetchWithRetry(
      `${API_URL}/api/v1/classes/${classId}/invitations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${teacherToken}`,
        },
        body: JSON.stringify({
          expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
        }),
      },
    );
    const inv = await invRes.json();
    inviteToken = inv.token;
  });

  test("Unauthenticated user sees register/login on join page", async ({
    page,
  }) => {
    await page.goto(`/join/${inviteToken}`);

    await expect(page.getByText("You've been invited to join")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("Enrollment E2E Class")).toBeVisible();

    const registerLink = page.getByRole("link", { name: "Register" });
    await expect(registerLink).toBeVisible();
    const href = await registerLink.getAttribute("href");
    expect(href).toContain("/register");
    expect(href).toContain("redirect=");
  });

  test("Student registers with redirect and joins class via consent dialog", async ({
    page,
  }) => {
    const redirectUrl = encodeURIComponent(`/join/${inviteToken}`);
    await page.goto(`/register?redirect=${redirectUrl}`);

    await expect(
      page.getByRole("heading", { name: "Create account" }),
    ).toBeVisible({ timeout: 10000 });

    await page.getByLabel("First name").fill(STUDENT.first_name);
    await page.getByLabel("Last name").fill("EnrTest");
    await page.getByLabel("Email").fill(STUDENT.email);
    await page.getByLabel("Password").fill(STUDENT.password);

    await page.getByText("Select date").click();
    await page.getByRole("gridcell", { name: "15" }).first().click();

    await page.getByRole("radio", { name: "Student" }).check();
    await page.getByRole("checkbox").first().check();

    await page.getByRole("button", { name: /Create account/i }).click();

    // Should redirect back to join page
    await page.waitForURL(`**/join/${inviteToken}`, { timeout: 15000 });

    // Consent dialog
    await expect(page.getByText("Join Enrollment E2E Class")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("I understand and consent")).toBeVisible();

    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Join class" }).click();

    await expect(
      page.getByRole("button", { name: "Join class" }),
    ).not.toBeVisible({ timeout: 10000 });
  });

  test("Student sees the class in enrollments page", async ({
    context,
    page,
  }) => {
    await context.clearCookies();
    await loginUI(page, STUDENT.email, STUDENT.password);
    await page.waitForURL("**/dashboard");

    await page.goto("/enrollments");
    await expect(page.getByRole("heading", { name: "My Classes" })).toBeVisible(
      { timeout: 10000 },
    );

    await expect(page.getByText("Enrollment E2E Class")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("Judo")).toBeVisible();
    await expect(page.getByText("Belt system")).toBeVisible();
  });
});
