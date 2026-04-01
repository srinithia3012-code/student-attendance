import { hashPassword } from "../utils/hashPassword";
import { desc, eq, sql } from "drizzle-orm";
import { Request, Response } from "express";
import { z } from "zod";
import { db } from "../db/client";
import { users } from "../db/schema";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["admin", "teacher", "student"]),
  phoneNumber: z.string().min(7).max(20).optional(),
  address: z.string().max(255).optional(),
  parentName: z.string().max(150).optional(),
  education: z.string().max(150).optional(),
  dob: z.string().optional(),
  age: z.number().int().min(1).max(120).optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["admin", "teacher", "student"]).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  phoneNumber: z.string().min(7).max(20).optional(),
  address: z.string().max(255).optional(),
  parentName: z.string().max(150).optional(),
  education: z.string().max(150).optional(),
  dob: z.string().optional(),
  age: z.number().int().min(1).max(120).optional(),
});

const updateSelfSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  phoneNumber: z.string().min(7).max(20).optional(),
  address: z.string().max(255).optional(),
  parentName: z.string().max(150).optional(),
  education: z.string().max(150).optional(),
  dob: z.string().optional(),
  age: z.number().int().min(1).max(120).optional(),
});

export async function createUser(req: Request, res: Response) {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    const { name, email, password, role, phoneNumber, address, parentName, education, dob, age } = parsed.data;
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) return res.status(409).json({ message: "Email already exists" });

    const hashedPassword = await hashPassword(password);

    const createdUsers = await db
      .insert(users)
      .values({ name, email, password: hashedPassword, role, phoneNumber, address, parentName, education, dob, age })
      .returning({
        userId: users.userId,
        name: users.name,
        email: users.email,
        role: users.role,
        status: users.status,
        phoneNumber: users.phoneNumber,
        address: users.address,
        parentName: users.parentName,
        education: users.education,
        dob: users.dob,
        age: users.age,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    return res.status(201).json({ message: "User created", user: createdUsers[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getUsers(req: Request, res: Response) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    const allUsers = await db
      .select({
        userId: users.userId,
        name: users.name,
        email: users.email,
        role: users.role,
        status: users.status,
        phoneNumber: users.phoneNumber,
        address: users.address,
        parentName: users.parentName,
        education: users.education,
        dob: users.dob,
        age: users.age,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .orderBy(desc(users.userId))
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    const total = Number(totalResult[0]?.count ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return res.json({
      users: allUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching users", error });
  }
}

export async function getUserById(req: Request, res: Response) {
  try {
    const userId = Number(req.params.id);
    if (Number.isNaN(userId)) return res.status(400).json({ message: "Invalid user id" });

    const user = await db
      .select({
        userId: users.userId,
        name: users.name,
        email: users.email,
        role: users.role,
        status: users.status,
        phoneNumber: users.phoneNumber,
        address: users.address,
        parentName: users.parentName,
        education: users.education,
        dob: users.dob,
        age: users.age,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1);

    if (user.length === 0) return res.status(404).json({ message: "User not found" });
    return res.json({ user: user[0] });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching user", error });
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const userId = Number(req.params.id);
    if (Number.isNaN(userId)) return res.status(400).json({ message: "Invalid user id" });

    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    const updateData: any = { ...parsed.data };
    if (updateData.password) updateData.password = await hashPassword(updateData.password);

    const result = await db.update(users).set(updateData).where(eq(users.userId, userId));
    if (result.rowCount === 0) return res.status(404).json({ message: "User not found" });

    return res.json({ message: "User updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

export async function updateMe(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const parsed = updateSelfSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    const updateData: any = { ...parsed.data };

    if (updateData.email) {
      const existingUser = await db
        .select({ userId: users.userId })
        .from(users)
        .where(eq(users.email, updateData.email))
        .limit(1);
      if (existingUser.length > 0 && existingUser[0].userId !== userId) {
        return res.status(409).json({ message: "Email already exists" });
      }
    }

    if (updateData.password) updateData.password = await hashPassword(updateData.password);

    const result = await db.update(users).set(updateData).where(eq(users.userId, userId));
    if (result.rowCount === 0) return res.status(404).json({ message: "User not found" });

    return res.json({ message: "Profile updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const userId = Number(req.params.id);
    if (Number.isNaN(userId)) return res.status(400).json({ message: "Invalid user id" });

    const result = await db.delete(users).where(eq(users.userId, userId));
    if (result.rowCount === 0) return res.status(404).json({ message: "User not found" });

    return res.json({ message: "User deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const result = await db
      .select({
        userId: users.userId,
        name: users.name,
        email: users.email,
        role: users.role,
        status: users.status,
        phoneNumber: users.phoneNumber,
        address: users.address,
        parentName: users.parentName,
        education: users.education,
        dob: users.dob,
        age: users.age,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1);

    if (result.length === 0) return res.status(404).json({ message: "User not found" });
    return res.json({ user: result[0] });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching profile", error });
  }
}
