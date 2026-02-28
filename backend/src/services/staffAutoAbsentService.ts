import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { staffAttendance, users } from "../db/schema";

function getTodayLocalIso(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseCutoffMinutes(raw: string | undefined): number {
  const value = raw?.trim() || "10:00";
  const [hText, mText] = value.split(":");
  const h = Number(hText);
  const m = Number(mText);

  if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return 10 * 60;
  }

  return h * 60 + m;
}

async function runAutoAbsentIfNeeded(): Promise<void> {
  const now = new Date();
  const cutoffMinutes = parseCutoffMinutes(process.env.STAFF_ABSENT_CUTOFF);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  if (nowMinutes < cutoffMinutes) return;

  const today = getTodayLocalIso(now);

  const activeTeachers = await db
    .select({ userId: users.userId })
    .from(users)
    .where(and(eq(users.role, "teacher"), eq(users.status, "active")));

  if (activeTeachers.length === 0) return;

  const todayRows = await db
    .select({ teacherId: staffAttendance.teacherId })
    .from(staffAttendance)
    .where(eq(staffAttendance.attendanceDate, today));

  const markedTeacherIds = new Set(todayRows.map((row) => row.teacherId));
  const missingTeachers = activeTeachers
    .map((row) => row.userId)
    .filter((teacherId) => !markedTeacherIds.has(teacherId));

  if (missingTeachers.length === 0) return;

  await db.insert(staffAttendance).values(
    missingTeachers.map((teacherId) => ({
      teacherId,
      attendanceDate: today,
      status: "absent" as const,
      scanType: "auto",
    }))
  );
}

export function startStaffAutoAbsentService(): void {
  setTimeout(() => {
    runAutoAbsentIfNeeded().catch((error) => {
      console.error("Auto-absent startup run failed:", error);
    });
  }, 5000);

  setInterval(() => {
    runAutoAbsentIfNeeded().catch((error) => {
      console.error("Auto-absent interval run failed:", error);
    });
  }, 60 * 1000);
}

