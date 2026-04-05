import { test, expect } from "@playwright/test";
import { API_URL, registerViaAPI, loginUI, fetchWithRetry } from "./helpers";

const ts = Date.now();

const TEACHER = {
  email: `teacher-notif-${ts}@test.com`,
  password: "Test1234!",
  first_name: "TeacherNotif",
  profile_type: "teacher" as const,
  birth_date: "1990-01-15",
};

const STUDENT = {
  email: `student-notif-${ts}@test.com`,
  password: "Test1234!",
  first_name: "StudentNotif",
  profile_type: "student" as const,
  birth_date: "2000-05-20",
};

let teacherToken: string;
let studentToken: string;
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
      name: "Notif E2E Class",
      martial_art: "Kickboxing",
      has_belt_system: true,
      schedules: [{ day_of_week: 1, start_time: "18:00", end_time: "19:30" }],
    }),
  });
  const cls = await clsRes.json();
  classId = cls.id;

  // Create invitation
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

  // Enroll student
  await fetchWithRetry(`${API_URL}/api/v1/join/${inv.token}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({ consent: true }),
  });

  // Create announcement to trigger notification for student
  await fetchWithRetry(`${API_URL}/api/v1/classes/${classId}/announcements`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${teacherToken}`,
    },
    body: JSON.stringify({
      title: "Notification Test Announcement",
      content: "This announcement creates a notification for the student.",
    }),
  });
}

test.describe("Notifications", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    teacherToken = await registerViaAPI(TEACHER);
    studentToken = await registerViaAPI(STUDENT);
    await createClassAndEnroll();
  });

  test("Student sees notifications on the notifications page", async ({
    page,
  }) => {
    await loginUI(page, STUDENT.email, STUDENT.password);
    await page.waitForURL("**/dashboard");

    await page.goto("/notifications");
    await expect(
      page.getByRole("heading", { name: "Notifications" }),
    ).toBeVisible({ timeout: 10000 });

    // Should have at least the announcement notification
    // (enrollment notification from join + announcement notification)
    await expect(page.getByText("No notifications")).not.toBeVisible();
  });

  test("Student can mark all notifications as read", async ({
    context,
    page,
  }) => {
    await context.clearCookies();
    await loginUI(page, STUDENT.email, STUDENT.password);
    await page.waitForURL("**/dashboard");

    await page.goto("/notifications");
    await expect(
      page.getByRole("heading", { name: "Notifications" }),
    ).toBeVisible({ timeout: 10000 });

    // Mark all read button should be visible (since there are unread notifications)
    const markAllBtn = page.getByRole("button", { name: "Mark all read" });
    await expect(markAllBtn).toBeVisible({ timeout: 10000 });
    await markAllBtn.click();

    // Mark all read button should disappear after all are read
    await expect(markAllBtn).not.toBeVisible({ timeout: 10000 });
  });

  test("Notification bell badge disappears after marking all read", async ({
    context,
    page,
  }) => {
    await context.clearCookies();
    await loginUI(page, STUDENT.email, STUDENT.password);
    await page.waitForURL("**/dashboard");

    // Bell should not have unread badge anymore
    const bell = page.getByRole("button", { name: "Notifications" });
    await expect(bell).toBeVisible({ timeout: 10000 });
    const badge = bell.locator("span.bg-primary");
    await expect(badge).not.toBeVisible({ timeout: 10000 });
  });

  test("Teacher sees enrollment notification", async ({ context, page }) => {
    await context.clearCookies();
    await loginUI(page, TEACHER.email, TEACHER.password);
    await page.waitForURL("**/dashboard");

    await page.goto("/notifications");
    await expect(
      page.getByRole("heading", { name: "Notifications" }),
    ).toBeVisible({ timeout: 10000 });

    // Teacher should have notification about student enrollment
    await expect(page.getByText("No notifications")).not.toBeVisible();
  });
});
