import { test, expect } from "@playwright/test";
import { API_URL, registerViaAPI, loginUI, fetchWithRetry } from "./helpers";

const ts = Date.now();

const TEACHER = {
  email: `teacher-priv-${ts}@test.com`,
  password: "Test1234!",
  first_name: "TeacherPriv",
  profile_type: "teacher" as const,
  birth_date: "1990-01-15",
};

const STUDENT = {
  email: `student-priv-${ts}@test.com`,
  password: "Test1234!",
  first_name: "StudentPriv",
  profile_type: "student" as const,
  birth_date: "2000-05-20",
};

let teacherToken: string;
let classId: string;

async function createClassAndEnroll(): Promise<void> {
  // Create class
  const clsRes = await fetchWithRetry(`${API_URL}/api/v1/classes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${teacherToken}`,
    },
    body: JSON.stringify({
      name: "Privacy E2E Class",
      martial_art: "Judo",
      has_belt_system: false,
      schedules: [{ day_of_week: 2, start_time: "16:00", end_time: "17:30" }],
    }),
  });
  const cls = await clsRes.json();
  classId = cls.id;

  // Create invitation and enroll student
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

  const studentToken = await registerViaAPI(STUDENT);
  await fetchWithRetry(`${API_URL}/api/v1/join/${inv.token}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({ consent: true }),
  });
}

test.describe("Privacy & Account Deletion", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    teacherToken = await registerViaAPI(TEACHER);
    await createClassAndEnroll();
  });

  test("Student is enrolled before deletion", async ({ page }) => {
    await loginUI(page, STUDENT.email, STUDENT.password);
    await page.waitForURL("**/dashboard");

    await page.goto("/enrollments");
    await expect(page.getByText("Privacy E2E Class")).toBeVisible({
      timeout: 10000,
    });
  });

  test("Teacher sees student in class before deletion", async ({
    context,
    page,
  }) => {
    await context.clearCookies();
    await loginUI(page, TEACHER.email, TEACHER.password);
    await page.waitForURL("**/dashboard");

    await page.goto(`/classes/${classId}/students`);
    await expect(page.getByText("Enrolled Students")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("StudentPriv")).toBeVisible({ timeout: 10000 });
  });

  test("Student deletes account via privacy center", async ({
    context,
    page,
  }) => {
    await context.clearCookies();
    await loginUI(page, STUDENT.email, STUDENT.password);
    await page.waitForURL("**/dashboard");

    await page.goto("/privacy");
    await expect(page.getByText("Privacy Center")).toBeVisible({
      timeout: 10000,
    });

    // Click "Delete my account" button
    await page.getByRole("button", { name: "Delete my account" }).click();

    // Confirmation dialog appears
    await expect(page.getByText("Type DELETE to confirm")).toBeVisible();

    // Type DELETE in the confirmation input
    await page.getByPlaceholder("Type DELETE").fill("DELETE");

    // Click confirm button
    await page.getByRole("button", { name: "Confirm deletion" }).click();

    // Should redirect to login page after deletion
    await page.waitForURL("**/login", { timeout: 15000 });
  });

  test("Deleted student cannot log back in", async ({ context, page }) => {
    await context.clearCookies();
    await page.goto("/login");

    await page.getByLabel("Email").fill(STUDENT.email);
    await page.getByLabel("Password").fill(STUDENT.password);
    await page.getByRole("button", { name: "Sign in" }).click();

    // Should see error and stay on login page
    await expect(page.getByText(/invalid|credentials|not found/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test("Teacher's class still exists after student deletion", async ({
    context,
    page,
  }) => {
    await context.clearCookies();
    await loginUI(page, TEACHER.email, TEACHER.password);
    await page.waitForURL("**/dashboard");

    await page.goto("/classes");
    await expect(page.getByText("Privacy E2E Class")).toBeVisible({
      timeout: 10000,
    });
  });

  test("Student no longer appears in teacher's student list", async ({
    context,
    page,
  }) => {
    await context.clearCookies();
    await loginUI(page, TEACHER.email, TEACHER.password);
    await page.waitForURL("**/dashboard");

    await page.goto(`/classes/${classId}/students`);
    await expect(page.getByText("Enrolled Students")).toBeVisible({
      timeout: 10000,
    });

    // Student should no longer be in the list
    await expect(page.getByText("StudentPriv")).not.toBeVisible({
      timeout: 5000,
    });
  });
});
