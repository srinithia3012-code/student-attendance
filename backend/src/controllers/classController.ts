import { eq } from "drizzle-orm";
import { Request, Response } from "express";
import { z } from "zod";
import { db } from "../db/client";
import { classes } from "../db/schema";

const createClassSchema = z.object({
  name: z.string().min(1),
  semester: z.number().int().min(1),
  section: z.string().optional(),
});

const updateClassSchema = createClassSchema.partial();

export async function createClass(req: Request, res: Response) {
  try {
    const parsed = createClassSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    const { name, semester, section } = parsed.data;
    const result = await db.insert(classes).values({ name, semester, section });
    return res.status(201).json({ message: "Class created", result });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

export async function getClasses(_: Request, res: Response) {
  try {
    const allClasses = await db.select().from(classes);
    return res.json({ classes: allClasses });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching classes", error });
  }
}

export async function getClassById(req: Request, res: Response) {
  try {
    const classId = Number(req.params.id);
    if (Number.isNaN(classId)) return res.status(400).json({ message: "Invalid class id" });

    const classData = await db.select().from(classes).where(eq(classes.classId, classId)).limit(1);
    if (classData.length === 0) return res.status(404).json({ message: "Class not found" });

    return res.json({ class: classData[0] });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching class", error });
  }
}

export async function updateClass(req: Request, res: Response) {
  try {
    const classId = Number(req.params.id);
    if (Number.isNaN(classId)) return res.status(400).json({ message: "Invalid class id" });

    const parsed = updateClassSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    const result = await db.update(classes).set(parsed.data).where(eq(classes.classId, classId));
    if (result.rowCount === 0) return res.status(404).json({ message: "Class not found" });

    return res.json({ message: "Class updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

export async function deleteClass(req: Request, res: Response) {
  try {
    const classId = Number(req.params.id);
    if (Number.isNaN(classId)) return res.status(400).json({ message: "Invalid class id" });

    const result = await db.delete(classes).where(eq(classes.classId, classId));
    if (result.rowCount === 0) return res.status(404).json({ message: "Class not found" });

    return res.json({ message: "Class deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}
