import { test, expect } from "@playwright/test";
import { API_URL, registerViaAPI, loginUI, fetchWithRetry } from "./helpers";

const ts = Date.now();

const TEACHER = {
  email: `teacher-af-${ts}@test.com`,
  password: "Test1234!",
  first_name: "TeacherAF",
  profile_type: "teacher" as const,
  birth_date: "1990-01-15",
};

const STUDENT_A = {
  email: `studentA-af-${ts}@test.com`,
  password: "Test1234!",
  first_name: "StudentA",
  profile_type: "student" as const,
  birth_date: "2000-05-20",
};

const STUDENT_B = {
  email: `studentB-af-${ts}@test.com`,
  password: "Test1234!",
  first_name: "StudentB",
  profile_type: "student" as const,
  birth_date: "2000-06-10",
};

let teacherToken: string;
let classId: string;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function createClassViaAPI(token: string): Promise<string> {
  const res = await fetchWithRetry(`${API_URL}/api/v1/classes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: "AF E2E Class",
      martial_art: "Kickboxing",
      has_belt_system: false,
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
  // Create invitation
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

  // Join
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

  // Revoke the invitation so the next enrollment can create a new one
  await fetchWithRetry(`${API_URL}/api/v1/invitations/${inv.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${teacherTk}` },
  });

  return enrollment.id as string;
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

test.describe("Announcements & Feedback", () => {
  test.describe.configure({ mode: "serial" });

  let enrollmentA: string;
  let enrollmentB: string;

  test.beforeAll(async () => {
    teacherToken = await registerViaAPI(TEACHER);
    const studentAToken = await registerViaAPI(STUDENT_A);
    const studentBToken = await registerViaAPI(STUDENT_B);

    classId = await createClassViaAPI(teacherToken);
    enrollmentA = await enrollStudentViaAPI(
      teacherToken,
      studentAToken,
      classId,
    );
    enrollmentB = await enrollStudentViaAPI(
      teacherToken,
      studentBToken,
      classId,
    );
  });

  // -------------------------------------------------------------------------
  // Announcement flow
  // -------------------------------------------------------------------------

  test("Teacher creates an announcement that appears in the feed", async ({
    page,
  }) => {
    await loginUI(page, TEACHER.email, TEACHER.password);
    await page.waitForURL("**/dashboard");

    // Navigate to class → announcements tab
    await page.goto(`/classes/${classId}/announcements`);
    await expect(page.getByRole("link", { name: "Announcements" })).toBeVisible(
      {
        timeout: 10000,
      },
    );

    // Empty state
    await expect(page.getByText("No announcements yet.")).toBeVisible();

    // Open form
    await page.getByRole("button", { name: /New announcement/i }).click();
    await expect(page.getByText("New announcement")).toBeVisible();

    // Fill and submit
    await page.getByLabel("Title").fill("Grading next Saturday");
    await page
      .getByLabel("Content")
      .fill(
        "Belt grading will be held next Saturday at 10 AM. Please arrive 15 minutes early.",
      );
    await page.getByRole("button", { name: /Post announcement/i }).click();

    // Announcement appears in feed
    await expect(page.getByText("Grading next Saturday")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/Belt grading will be held/)).toBeVisible();
    await expect(page.getByText("TeacherAF").nth(1)).toBeVisible();

    // Teacher sees Delete button
    await expect(page.getByRole("button", { name: /Delete/i })).toBeVisible();
  });

  test("Student sees the announcement but no create/delete controls", async ({
    context,
    page,
  }) => {
    await context.clearCookies();
    await loginUI(page, STUDENT_A.email, STUDENT_A.password);
    await page.waitForURL("**/dashboard");

    // Student navigates to the class announcements page
    await page.goto(`/classes/${classId}/announcements`);

    // Student can see the announcement
    await expect(page.getByText("Grading next Saturday")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/Belt grading will be held/)).toBeVisible();

    // Student does NOT see create button
    await expect(
      page.getByRole("button", { name: /New announcement/i }),
    ).not.toBeVisible();

    // Student does NOT see delete button
    await expect(
      page.getByRole("button", { name: /Delete/i }),
    ).not.toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Feedback flow
  // -------------------------------------------------------------------------

  test("Teacher sends feedback to a student via the students tab", async ({
    context,
    page,
  }) => {
    await context.clearCookies();
    await loginUI(page, TEACHER.email, TEACHER.password);
    await page.waitForURL("**/dashboard");

    // Navigate to class → students tab
    await page.goto(`/classes/${classId}/students`);
    await expect(page.getByText("Enrolled Students")).toBeVisible({
      timeout: 10000,
    });

    // Find StudentA's row and expand feedback panel
    const studentARow = page.getByRole("row").filter({ hasText: "StudentA" });
    await expect(studentARow).toBeVisible();
    await studentARow.getByRole("button", { name: /Feedback/i }).click();

    // Feedback panel opens
    await expect(page.getByText("Feedback for StudentA")).toBeVisible();
    await expect(page.getByPlaceholder("Write your feedback...")).toBeVisible();

    // Fill and send feedback
    await page
      .getByPlaceholder("Write your feedback...")
      .fill(
        "Excellent guard passing today! Your hip movement has improved a lot since last month.",
      );
    await page.getByRole("button", { name: /Send feedback/i }).click();

    // Feedback appears in the history
    await expect(page.getByText(/Excellent guard passing today/)).toBeVisible({
      timeout: 10000,
    });
  });

  test("Student sees feedback on the /feedback page", async ({
    context,
    page,
  }) => {
    await context.clearCookies();
    await loginUI(page, STUDENT_A.email, STUDENT_A.password);
    await page.waitForURL("**/dashboard");

    await page.goto("/feedback");

    await expect(page.getByText("My feedback")).toBeVisible({
      timeout: 10000,
    });

    // See the feedback sent by the teacher
    await expect(page.getByText(/Excellent guard passing today/)).toBeVisible({
      timeout: 10000,
    });

    // Class name label is shown
    await expect(page.getByText("AF E2E Class")).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Data isolation
  // -------------------------------------------------------------------------

  test("Student B cannot see Student A's feedback on the /feedback page", async ({
    context,
    page,
  }) => {
    await context.clearCookies();
    await loginUI(page, STUDENT_B.email, STUDENT_B.password);
    await page.waitForURL("**/dashboard");

    await page.goto("/feedback");
    await expect(page.getByText("My feedback")).toBeVisible({
      timeout: 10000,
    });

    // Student B should see "No feedback yet" — not Student A's feedback
    await expect(page.getByText("No feedback yet.")).toBeVisible();
    await expect(
      page.getByText(/Excellent guard passing today/),
    ).not.toBeVisible();
  });
});
