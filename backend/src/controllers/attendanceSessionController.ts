import { Request, Response } from "express";
import { z } from "zod";
import { db } from "../db/client";
import { attendanceSessions } from "../db/schema";

const createAttendanceSessionSchema = z.object({
  classId: z.number().int(),
  subjectId: z.number().int(),
  sessionDate: z.string(),
});

export async function createAttendanceSession(req: Request, res: Response) {
  try {
    const parsed = createAttendanceSessionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    const { classId, subjectId, sessionDate } = parsed.data;
    const result = await db.insert(attendanceSessions).values({ classId, subjectId, sessionDate });
    return res.status(201).json({ message: "Attendance session created", result });
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
