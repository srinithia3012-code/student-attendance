import { Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client";
import { attendance, attendanceSessions, subjects } from "../db/schema";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time format")
  .optional()
  .nullable();

const createAttendanceSessionSchema = z.object({
  classId: z.number().int(),
  subjectId: z.number().int(),
  sessionDate: z.string().min(1),
  sessionStartTime: timeSchema,
  sessionEndTime: timeSchema,
});

const updateAttendanceSessionSchema = createAttendanceSessionSchema.partial();

async function canManageSubject(user: AuthenticatedRequest["user"], subjectId: number) {
  if (!user) return false;
  if (user.role === "admin") return true;

  const rows = await db
    .select({ teacherId: subjects.teacherId })
    .from(subjects)
    .where(eq(subjects.subjectId, subjectId))
    .limit(1);

  return rows.length > 0 && Number(rows[0].teacherId) === Number(user.userId);
}

async function getSubjectById(subjectId: number) {
  const rows = await db
    .select({
      subjectId: subjects.subjectId,
      classId: subjects.classId,
      teacherId: subjects.teacherId,
    })
    .from(subjects)
    .where(eq(subjects.subjectId, subjectId))
    .limit(1);

  return rows[0] || null;
}

export async function createAttendanceSession(req: AuthenticatedRequest, res: Response) {
  try {
    const parsed = createAttendanceSessionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    const { classId, subjectId, sessionDate, sessionStartTime, sessionEndTime } = parsed.data;
    const subject = await getSubjectById(subjectId);
    if (!subject) return res.status(404).json({ message: "Subject not found" });
    if (Number(subject.classId) !== Number(classId)) {
      return res.status(400).json({ message: "Subject does not belong to the selected class" });
    }
    if (!(await canManageSubject(req.user, subjectId))) {
      return res.status(403).json({ message: "Forbidden: you can only manage your own subject sessions" });
    }

    const result = await db
      .insert(attendanceSessions)
      .values({
        classId,
        subjectId,
        sessionDate,
        sessionStartTime: sessionStartTime ?? null,
        sessionEndTime: sessionEndTime ?? null,
      })
      .returning();

    return res.status(201).json({ message: "Attendance session created", session: result[0] });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

export async function getAttendanceSessions(_: Request, res: Response) {
  try {
    const sessions = await db.select().from(attendanceSessions);
    return res.json({ sessions });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching sessions", error });
  }
}

export async function updateAttendanceSession(req: AuthenticatedRequest, res: Response) {
  try {
    const sessionId = Number(req.params.sessionId);
    if (Number.isNaN(sessionId)) return res.status(400).json({ message: "Invalid session id" });

    const parsed = updateAttendanceSessionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    const existing = await db.select().from(attendanceSessions).where(eq(attendanceSessions.sessionId, sessionId)).limit(1);
    if (existing.length === 0) return res.status(404).json({ message: "Session not found" });

    const nextSubjectId = parsed.data.subjectId ?? existing[0].subjectId;
    const nextClassId = parsed.data.classId ?? existing[0].classId;
    const subject = await getSubjectById(nextSubjectId);
    if (!subject) return res.status(404).json({ message: "Subject not found" });
    if (Number(subject.classId) !== Number(nextClassId)) {
      return res.status(400).json({ message: "Subject does not belong to the selected class" });
    }
    if (!(await canManageSubject(req.user, nextSubjectId))) {
      return res.status(403).json({ message: "Forbidden: you can only manage your own subject sessions" });
    }

    const updateValues = {
      ...(parsed.data.classId !== undefined ? { classId: parsed.data.classId } : {}),
      ...(parsed.data.subjectId !== undefined ? { subjectId: parsed.data.subjectId } : {}),
      ...(parsed.data.sessionDate !== undefined ? { sessionDate: parsed.data.sessionDate } : {}),
      ...(parsed.data.sessionStartTime !== undefined
        ? { sessionStartTime: parsed.data.sessionStartTime ?? null }
        : {}),
      ...(parsed.data.sessionEndTime !== undefined ? { sessionEndTime: parsed.data.sessionEndTime ?? null } : {}),
    };

    const result = await db
      .update(attendanceSessions)
      .set(updateValues)
      .where(eq(attendanceSessions.sessionId, sessionId))
      .returning();

    return res.json({ message: "Attendance session updated", session: result[0] });
  } catch (error) {
    return res.status(500).json({ message: "Error updating session", error });
  }
}

export async function deleteAttendanceSession(req: AuthenticatedRequest, res: Response) {
  try {
    const sessionId = Number(req.params.sessionId);
    if (Number.isNaN(sessionId)) return res.status(400).json({ message: "Invalid session id" });

    const existing = await db.select().from(attendanceSessions).where(eq(attendanceSessions.sessionId, sessionId)).limit(1);
    if (existing.length === 0) return res.status(404).json({ message: "Session not found" });

    if (!(await canManageSubject(req.user, existing[0].subjectId))) {
      return res.status(403).json({ message: "Forbidden: you can only manage your own subject sessions" });
    }

    const linkedAttendance = await db
      .select({ attendanceId: attendance.attendanceId })
      .from(attendance)
      .where(eq(attendance.sessionId, sessionId))
      .limit(1);

    if (linkedAttendance.length > 0) {
      return res.status(400).json({ message: "Cannot delete a session that already has attendance records" });
    }

    await db.delete(attendanceSessions).where(eq(attendanceSessions.sessionId, sessionId));
    return res.json({ message: "Attendance session deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting session", error });
  }
}
