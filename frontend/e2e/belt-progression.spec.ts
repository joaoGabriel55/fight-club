import { test, expect } from "@playwright/test";
import { API_URL, registerViaAPI, loginUI, fetchWithRetry } from "./helpers";

const ts = Date.now();

const TEACHER = {
  email: `teacher-bp-${ts}@test.com`,
  password: "Test1234!",
  first_name: "TeacherBP",
  profile_type: "teacher" as const,
  birth_date: "1990-01-15",
};

const STUDENT = {
  email: `student-bp-${ts}@test.com`,
  password: "Test1234!",
  first_name: "StudentBP",
  profile_type: "student" as const,
  birth_date: "2000-05-20",
};

let teacherToken: string;
let studentToken: string;
let classId: string;

async function createBeltClassViaAPI(token: string): Promise<string> {
  const res = await fetchWithRetry(`${API_URL}/api/v1/classes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: "Belt Prog E2E Class",
      martial_art: "BJJ",
      has_belt_system: true,
      schedules: [{ day_of_week: 5, start_time: "10:00", end_time: "11:30" }],
    }),
  });
  if (!res.ok) throw new Error(`Create class failed: ${res.status}`);
  const data = await res.json();
  return data.id as string;
}

async function enrollStudentViaAPI(
  teacherTk: string,
  studentTk: string,
  clsId: string,
): Promise<string> {
  const invRes = await fetchWithRetry(
    `${API_URL}/api/v1/classes/${clsId}/invitations`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${teacherTk}`,
      },
      body: JSON.stringify({
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      }),
    },
  );
  if (!invRes.ok) throw new Error(`Create invitation failed: ${invRes.status}`);
  const inv = await invRes.json();

  const joinRes = await fetchWithRetry(`${API_URL}/api/v1/join/${inv.token}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${studentTk}`,
    },
    body: JSON.stringify({ consent: true }),
  });
  if (!joinRes.ok) throw new Error(`Join class failed: ${joinRes.status}`);
  const enrollment = await joinRes.json();

  await fetchWithRetry(`${API_URL}/api/v1/invitations/${inv.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${teacherTk}` },
  });

  return enrollment.id as string;
}

test.describe("Belt Progression", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    teacherToken = await registerViaAPI(TEACHER);
    studentToken = await registerViaAPI(STUDENT);
    classId = await createBeltClassViaAPI(teacherToken);
    await enrollStudentViaAPI(teacherToken, studentToken, classId);
  });

  test("Teacher awards belt to student in belt-enabled class", async ({
    page,
  }) => {
    await loginUI(page, TEACHER.email, TEACHER.password);
    await page.waitForURL("**/dashboard");

    await page.goto(`/classes/${classId}/students`);
    await expect(page.getByText("Enrolled Students")).toBeVisible({
      timeout: 10000,
    });

    const studentRow = page.getByRole("row").filter({ hasText: "StudentBP" });
    await expect(studentRow).toBeVisible();
    await studentRow.getByRole("button", { name: /Belts/i }).click();

    await expect(page.getByText("Belt history for StudentBP")).toBeVisible();
    await expect(page.getByText("No belts awarded yet")).toBeVisible();

    // Award White belt
    await page.getByRole("combobox").selectOption("White");
    await page.getByRole("button", { name: /Award belt/i }).click();

    await expect(page.locator("span").filter({ hasText: "White" })).toBeVisible(
      { timeout: 10000 },
    );

    // Award Yellow belt
    await page.getByRole("combobox").selectOption("Yellow");
    await page.getByRole("button", { name: /Award belt/i }).click();

    await expect(
      page.locator("span").filter({ hasText: "Yellow" }),
    ).toBeVisible({ timeout: 10000 });
  });

  test("Student sees belt timeline and notification", async ({
    context,
    page,
  }) => {
    await context.clearCookies();
    await loginUI(page, STUDENT.email, STUDENT.password);
    await page.waitForURL("**/dashboard");

    // Check notification bell has unread badge (belt_awarded notifications)
    const bell = page.getByRole("button", { name: "Notifications" });
    await expect(bell).toBeVisible({ timeout: 10000 });
    const badge = bell.locator("span.bg-primary");
    await expect(badge).toBeVisible({ timeout: 10000 });

    // Navigate to notifications page
    await page.goto("/notifications");
    await expect(
      page.getByRole("heading", { name: "Notifications" }),
    ).toBeVisible({ timeout: 10000 });

    // Should have belt-related notifications
    await expect(page.getByText(/belt/i).first()).toBeVisible({
      timeout: 10000,
    });
  });
});
