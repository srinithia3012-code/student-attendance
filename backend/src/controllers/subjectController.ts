import { and, eq } from "drizzle-orm";
import { Request, Response } from "express";
import { z } from "zod";
import { db } from "../db/client";
import { subjects } from "../db/schema";

const createSubjectSchema = z.object({
  name: z.string().min(1),
  classId: z.number().int(),
  teacherId: z.number().int(),
});

const updateSubjectSchema = createSubjectSchema.partial();

export async function createSubject(req: Request, res: Response) {
  try {
    const parsed = createSubjectSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    const { name, classId, teacherId } = parsed.data;
    const existingSubject = await db
      .select()
      .from(subjects)
      .where(and(eq(subjects.classId, classId), eq(subjects.name, name)))
      .limit(1);

    if (existingSubject.length > 0) {
      return res.status(409).json({ message: `Subject "${name}" already exists in this class` });
    }

    const result = await db.insert(subjects).values({ name, classId, teacherId });
    return res.status(201).json({ message: "Subject created", result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error", error });
  }
}

export async function getSubjects(_: Request, res: Response) {
  try {
    const allSubjects = await db.select().from(subjects);
    return res.json({ subjects: allSubjects });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching subjects", error });
  }
}

export async function getSubjectById(req: Request, res: Response) {
  try {
    const subjectId = Number(req.params.id);
    if (Number.isNaN(subjectId)) return res.status(400).json({ message: "Invalid subject id" });

    const found = await db.select().from(subjects).where(eq(subjects.subjectId, subjectId)).limit(1);
    if (found.length === 0) return res.status(404).json({ message: "Subject not found" });

    return res.json({ subject: found[0] });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching subject", error });
  }
}

export async function updateSubject(req: Request, res: Response) {
  try {
    const subjectId = Number(req.params.id);
    if (Number.isNaN(subjectId)) return res.status(400).json({ message: "Invalid subject id" });

    const parsed = updateSubjectSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    const result = await db.update(subjects).set(parsed.data).where(eq(subjects.subjectId, subjectId));
    if (result.rowCount === 0) return res.status(404).json({ message: "Subject not found" });

    return res.json({ message: "Subject updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

export async function deleteSubject(req: Request, res: Response) {
  try {
    const subjectId = Number(req.params.id);
    if (Number.isNaN(subjectId)) return res.status(400).json({ message: "Invalid subject id" });

    const result = await db.delete(subjects).where(eq(subjects.subjectId, subjectId));
    if (result.rowCount === 0) return res.status(404).json({ message: "Subject not found" });

    return res.json({ message: "Subject deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}
