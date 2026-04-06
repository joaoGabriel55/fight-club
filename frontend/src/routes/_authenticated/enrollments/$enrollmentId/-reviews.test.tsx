import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { format } from "date-fns";

function getSessionDateForToday(schedules: Array<{ day_of_week: number; start_time: string; end_time: string }>): string | null {
  const now = new Date();
  const currentDayOfWeek = now.getDay() === 0 ? 0 : now.getDay();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMinute;

  const todaySchedule = schedules.find((s) => s.day_of_week === currentDayOfWeek);

  if (!todaySchedule) {
    return null;
  }

  const [endHour, endMinute] = todaySchedule.end_time.split(":").map(Number);
  const endTimeMinutes = endHour * 60 + endMinute;

  if (currentTimeMinutes > endTimeMinutes) {
    return format(now, "yyyy-MM-dd");
  }

  return null;
}

describe("getSessionDateForToday", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns date string when Monday class ended at 14:00 and current time is 14:01", () => {
    vi.setSystemTime(new Date("2025-01-06T14:01:00"));

    const schedules = [{ day_of_week: 1, start_time: "13:00", end_time: "14:00" }];
    const result = getSessionDateForToday(schedules);

    expect(result).toBe("2025-01-06");
  });

  it("returns null when Monday schedule but current time is before end time", () => {
    vi.setSystemTime(new Date("2025-01-06T13:30:00"));

    const schedules = [{ day_of_week: 1, start_time: "13:00", end_time: "14:00" }];
    const result = getSessionDateForToday(schedules);

    expect(result).toBeNull();
  });

  it("returns null when no schedule for current day", () => {
    vi.setSystemTime(new Date("2025-01-06T14:00:00"));

    const schedules = [{ day_of_week: 3, start_time: "10:00", end_time: "11:00" }];
    const result = getSessionDateForToday(schedules);

    expect(result).toBeNull();
  });

  it("returns null when no schedules", () => {
    vi.setSystemTime(new Date("2025-01-06T14:00:00"));

    const result = getSessionDateForToday([]);
    expect(result).toBeNull();
  });

  it("returns null when class ends exactly at current time (not yet ended)", () => {
    vi.setSystemTime(new Date("2025-01-06T14:00:00"));

    const schedules = [{ day_of_week: 1, start_time: "13:00", end_time: "14:00" }];
    const result = getSessionDateForToday(schedules);

    expect(result).toBeNull();
  });

  it("returns date for Sunday when current day is Sunday (day 0)", () => {
    vi.setSystemTime(new Date("2025-01-05T15:00:00"));

    const schedules = [{ day_of_week: 0, start_time: "13:00", end_time: "14:00" }];
    const result = getSessionDateForToday(schedules);

    expect(result).toBe("2025-01-05");
  });

  it("returns null when multiple schedules but none today", () => {
    vi.setSystemTime(new Date("2025-01-06T14:00:00"));

    const schedules = [
      { day_of_week: 3, start_time: "10:00", end_time: "11:00" },
      { day_of_week: 5, start_time: "10:00", end_time: "11:00" },
    ];
    const result = getSessionDateForToday(schedules);

    expect(result).toBeNull();
  });

  it("handles end time with leading zeros", () => {
    vi.setSystemTime(new Date("2025-01-06T08:01:00"));

    const schedules = [{ day_of_week: 1, start_time: "07:00", end_time: "08:00" }];
    const result = getSessionDateForToday(schedules);

    expect(result).toBe("2025-01-06");
  });
});
