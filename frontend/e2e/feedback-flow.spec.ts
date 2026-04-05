import { test, expect } from "@playwright/test";
import { API_URL, registerViaAPI, loginUI, fetchWithRetry } from "./helpers";

const ts = Date.now();

const TEACHER = {
  email: `teacher-fb-${ts}@test.com`,
  password: "Test1234!",
  first_name: "TeacherFB",
  profile_type: "teacher" as const,
  birth_date: "1990-01-15",
};

const STUDENT = {
  email: `student-fb-${ts}@test.com`,
  password: "Test1234!",
  first_name: "StudentFB",
  profile_type: "student" as const,
  birth_date: "2000-05-20",
};

let teacherToken: string;
let classId: string;

async function createClassViaAPI(token: string): Promise<string> {
  const res = await fetchWithRetry(`${API_URL}/api/v1/classes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: "Feedback E2E Class",
      martial_art: "Boxing",
      has_belt_system: false,
      schedules: [{ day_of_week: 4, start_time: "19:00", end_time: "20:30" }],
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

test.describe("Feedback Flow", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    teacherToken = await registerViaAPI(TEACHER);
    const studentToken = await registerViaAPI(STUDENT);
    classId = await createClassViaAPI(teacherToken);
    await enrollStudentViaAPI(teacherToken, studentToken, classId);
  });

  test("Teacher sends feedback to student via students tab", async ({
    page,
  }) => {
    await loginUI(page, TEACHER.email, TEACHER.password);
    await page.waitForURL("**/dashboard");

    await page.goto(`/classes/${classId}/students`);
    await expect(page.getByText("Enrolled Students")).toBeVisible({
      timeout: 10000,
    });

    // Find student row and open feedback panel
    const studentRow = page.getByRole("row").filter({ hasText: "StudentFB" });
    await expect(studentRow).toBeVisible();
    await studentRow.getByRole("button", { name: /Feedback/i }).click();

    await expect(page.getByText("Feedback for StudentFB")).toBeVisible();

    // Send feedback
    await page
      .getByPlaceholder("Write your feedback...")
      .fill("Great technique on the jab-cross combo. Work on footwork next.");
    await page.getByRole("button", { name: /Send feedback/i }).click();

    // Feedback appears in history
    await expect(
      page.getByText(/Great technique on the jab-cross combo/),
    ).toBeVisible({ timeout: 10000 });
  });

  test("Student receives notification about feedback", async ({
    context,
    page,
  }) => {
    await context.clearCookies();
    await loginUI(page, STUDENT.email, STUDENT.password);
    await page.waitForURL("**/dashboard");

    // Check notification bell has unread badge
    const bell = page.getByRole("button", { name: "Notifications" });
    await expect(bell).toBeVisible({ timeout: 10000 });
    const badge = bell.locator("span.bg-primary");
    await expect(badge).toBeVisible({ timeout: 10000 });
  });

  test("Student sees feedback on /feedback page", async ({ context, page }) => {
    await context.clearCookies();
    await loginUI(page, STUDENT.email, STUDENT.password);
    await page.waitForURL("**/dashboard");

    await page.goto("/feedback");
    await expect(page.getByText("My feedback")).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.getByText(/Great technique on the jab-cross combo/),
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Feedback E2E Class")).toBeVisible();
  });
});
