import { test, expect } from "@playwright/test";
import { API_URL, registerViaAPI, loginUI, fetchWithRetry } from "./helpers";

const ts = Date.now();

const TEACHER = {
  email: `teacher-bn-${ts}@test.com`,
  password: "Test1234!",
  first_name: "TeacherBN",
  profile_type: "teacher" as const,
  birth_date: "1990-01-15",
};

const STUDENT = {
  email: `student-bn-${ts}@test.com`,
  password: "Test1234!",
  first_name: "StudentBN",
  profile_type: "student" as const,
  birth_date: "2000-05-20",
};

let teacherToken: string;
let studentToken: string;
let beltClassId: string;
let noBeltClassId: string;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function createClassViaAPI(
  token: string,
  hasBeltSystem: boolean,
  name: string,
): Promise<string> {
  const res = await fetchWithRetry(`${API_URL}/api/v1/classes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name,
      martial_art: "BJJ",
      has_belt_system: hasBeltSystem,
      schedules: [{ day_of_week: 2, start_time: "18:00", end_time: "19:30" }],
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

  // Revoke invitation for cleanup
  await fetchWithRetry(`${API_URL}/api/v1/invitations/${inv.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${teacherTk}` },
  });

  return enrollment.id as string;
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

test.describe("Belts & Notifications", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    teacherToken = await registerViaAPI(TEACHER);
    studentToken = await registerViaAPI(STUDENT);

    beltClassId = await createClassViaAPI(teacherToken, true, "BJJ Belt Class");
    noBeltClassId = await createClassViaAPI(
      teacherToken,
      false,
      "BJJ No Belt Class",
    );

    await enrollStudentViaAPI(teacherToken, studentToken, beltClassId);
    await enrollStudentViaAPI(teacherToken, studentToken, noBeltClassId);
  });

  // -------------------------------------------------------------------------
  // Belt flow
  // -------------------------------------------------------------------------

  test("Teacher awards belt to student in belt-enabled class", async ({
    page,
  }) => {
    await loginUI(page, TEACHER.email, TEACHER.password);
    await page.waitForURL("**/dashboard");

    // Navigate to belt-enabled class → students tab
    await page.goto(`/classes/${beltClassId}/students`);
    await expect(page.getByText("Enrolled Students")).toBeVisible({
      timeout: 10000,
    });

    // Find student row and click Belts
    const studentRow = page.getByRole("row").filter({ hasText: "StudentBN" });
    await expect(studentRow).toBeVisible();
    await studentRow.getByRole("button", { name: /Belts/i }).click();

    // Belt panel opens
    await expect(page.getByText("Belt history for StudentBN")).toBeVisible();
    await expect(page.getByText("No belts awarded yet")).toBeVisible();

    // Award a belt
    await page.getByRole("combobox").selectOption("Blue");
    await page.getByRole("button", { name: /Award belt/i }).click();

    // Belt appears in timeline (use locator to avoid matching the <option>)
    await expect(page.locator("span").filter({ hasText: "Blue" })).toBeVisible({
      timeout: 10000,
    });
  });

  test("Student sees notification in bell and can mark all read", async ({
    context,
    page,
  }) => {
    await context.clearCookies();
    await loginUI(page, STUDENT.email, STUDENT.password);
    await page.waitForURL("**/dashboard");

    // Check notification bell shows at least 1 unread (belt_awarded)
    const bell = page.getByRole("button", { name: "Notifications" });
    await expect(bell).toBeVisible({ timeout: 10000 });

    // There should be a badge with a count (at least enrollment notifications + belt)
    const badge = bell.locator("span.bg-primary");
    await expect(badge).toBeVisible({ timeout: 10000 });

    // Open notification panel and mark all read
    await bell.click();
    await expect(page.getByText("Mark all read")).toBeVisible({
      timeout: 10000,
    });
    await page.getByText("Mark all read").click();

    // Wait for badge to disappear
    await expect(badge).not.toBeVisible({ timeout: 10000 });
  });

  // -------------------------------------------------------------------------
  // No belt system
  // -------------------------------------------------------------------------

  test("No belt system: student profile does not show belt controls", async ({
    context,
    page,
  }) => {
    await context.clearCookies();
    await loginUI(page, TEACHER.email, TEACHER.password);
    await page.waitForURL("**/dashboard");

    await page.goto(`/classes/${noBeltClassId}/students`);
    await expect(page.getByText("Enrolled Students")).toBeVisible({
      timeout: 10000,
    });

    // Student row should NOT have a Belts button
    const studentRow = page.getByRole("row").filter({ hasText: "StudentBN" });
    await expect(studentRow).toBeVisible();
    await expect(
      studentRow.getByRole("button", { name: /Belts/i }),
    ).not.toBeVisible();
  });
});
