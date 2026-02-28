import { and, eq } from "drizzle-orm";
import { Request, Response } from "express";
import { z } from "zod";
import { db } from "../db/client";
import { students } from "../db/schema";

const createStudentSchema = z.object({
  userId: z.number().int(),
  classId: z.number().int(),
  rollNumber: z.string().min(1),
});

const updateStudentSchema = createStudentSchema.partial();

export async function createStudent(req: Request, res: Response) {
  try {
    const parsed = createStudentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    const { userId, classId, rollNumber } = parsed.data;
    const existingStudent = await db
      .select()
      .from(students)
      .where(and(eq(students.classId, classId), eq(students.rollNumber, rollNumber)))
      .limit(1);

    if (existingStudent.length > 0) {
      return res.status(409).json({ message: `Roll number ${rollNumber} already exists in this class` });
    }

    const result = await db.insert(students).values({ userId, classId, rollNumber });
    return res.status(201).json({ message: "Student added", result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error", error });
  }
}

export async function getStudents(_: Request, res: Response) {
  try {
    const allStudents = await db.select().from(students);
    return res.json({ students: allStudents });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching students", error });
  }
}

export async function getStudentById(req: Request, res: Response) {
  try {
    const studentId = Number(req.params.id);
    if (Number.isNaN(studentId)) return res.status(400).json({ message: "Invalid student id" });

    const studentData = await db.select().from(students).where(eq(students.studentId, studentId)).limit(1);
    if (studentData.length === 0) return res.status(404).json({ message: "Student not found" });

    return res.json({ student: studentData[0] });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching student", error });
  }
}

export async function updateStudent(req: Request, res: Response) {
  try {
    const studentId = Number(req.params.id);
    if (Number.isNaN(studentId)) return res.status(400).json({ message: "Invalid student id" });

    const parsed = updateStudentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    const result = await db.update(students).set(parsed.data).where(eq(students.studentId, studentId));
    if (result.rowCount === 0) return res.status(404).json({ message: "Student not found" });

    return res.json({ message: "Student updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

export async function deleteStudent(req: Request, res: Response) {
  try {
    const studentId = Number(req.params.id);
    if (Number.isNaN(studentId)) return res.status(400).json({ message: "Invalid student id" });

    const result = await db.delete(students).where(eq(students.studentId, studentId));
    if (result.rowCount === 0) return res.status(404).json({ message: "Student not found" });

    return res.json({ message: "Student deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}
