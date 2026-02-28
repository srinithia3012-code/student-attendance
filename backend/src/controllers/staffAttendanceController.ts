import { Request, Response } from "express";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client";
import { staffAttendance, users } from "../db/schema";

const createStaffAttendanceSchema = z.object({
  teacherId: z.number().int().positive(),
  date: z.string().min(1),
  department: z.string().max(100).optional().nullable(),
  subject: z.string().max(150).optional().nullable(),
  scanType: z.string().max(20).optional(),
  status: z.enum(["present", "absent", "late"]).optional(),
});

export async function createStaffAttendance(req: Request, res: Response) {
  try {
    const parsed = createStaffAttendanceSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    const { teacherId, date, department, subject, scanType, status } = parsed.data;

    const teacher = await db
      .select({ userId: users.userId, role: users.role, status: users.status })
      .from(users)
      .where(eq(users.userId, teacherId))
      .limit(1);

    if (teacher.length === 0) return res.status(404).json({ message: "Teacher not found" });
    if (teacher[0].role !== "teacher") return res.status(400).json({ message: "User is not a teacher" });

    const inserted = await db
      .insert(staffAttendance)
      .values({
        teacherId,
        attendanceDate: date,
        department: department ?? null,
        subject: subject ?? null,
        scanType: scanType ?? "qr",
        status: status ?? "present",
      })
      .returning();

    return res.status(201).json({ message: "Staff attendance stored", attendance: inserted[0] });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

export async function getStaffAttendance(req: Request, res: Response) {
  try {
    const teacherIdParam = req.query.teacherId;
    const dateParam = req.query.date;
    const records = await db.select().from(staffAttendance).orderBy(desc(staffAttendance.createdAt));
    const filtered = records.filter((item) => {
      if (teacherIdParam) {
        const teacherId = Number(teacherIdParam);
        if (Number.isNaN(teacherId)) return false;
        if (item.teacherId !== teacherId) return false;
      }
      if (dateParam && String(item.attendanceDate) !== String(dateParam)) return false;
      return true;
    });

    if (teacherIdParam && Number.isNaN(Number(teacherIdParam))) {
      return res.status(400).json({ message: "Invalid teacherId" });
    }

    return res.json({ attendance: filtered });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching staff attendance", error });
  }
}
