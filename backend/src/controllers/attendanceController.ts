import { Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client";
import { attendance, staffAttendance } from "../db/schema";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

const createAttendanceSchema = z.object({
  studentId: z.number().int(),
  subjectId: z.number().int(),
  sessionId: z.number().int(),
  attendanceDate: z.string(),
  status: z.enum(["present", "absent"]),
});

export async function createAttendance(req: AuthenticatedRequest, res: Response) {
  try {
    const parsed = createAttendanceSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    const { studentId, subjectId, sessionId, attendanceDate, status } = parsed.data;

    if (req.user?.role === "teacher") {
      const teacherAttendance = await db
        .select({ status: staffAttendance.status })
        .from(staffAttendance)
        .where(and(eq(staffAttendance.teacherId, req.user.userId), eq(staffAttendance.attendanceDate, attendanceDate)))
        .limit(1);

      if (teacherAttendance[0]?.status === "absent") {
        return res.status(403).json({
          message: "You cannot mark student attendance while your staff attendance is marked absent for this date.",
        });
      }
    }

    const result = await db.insert(attendance).values({ studentId, subjectId, sessionId, attendanceDate, status });
    return res.status(201).json({ message: "Attendance recorded", result });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

export async function getAttendance(_: Request, res: Response) {
  try {
    const records = await db.select().from(attendance);
    return res.json({ attendance: records });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching attendance", error });
  }
}

export async function getAttendanceByStudent(req: Request, res: Response) {
  try {
    const studentId = Number(req.params.studentId);
    if (Number.isNaN(studentId)) return res.status(400).json({ message: "Invalid student id" });

    const records = await db.select().from(attendance).where(eq(attendance.studentId, studentId));
    return res.json({ attendance: records });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching attendance by student", error });
  }
}
