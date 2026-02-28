import { eq } from "drizzle-orm";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { db } from "../db/client";
import { users } from "../db/schema";
import { comparePassword, hashPassword } from "../utils/hashPassword";

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["admin", "teacher", "student"]),
  parentName: z.string().max(150).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

function signToken(payload: { userId: number; role: "admin" | "teacher" | "student"; email: string }) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET");
  return jwt.sign(payload, secret, { expiresIn: "1d" });
}

function frontendUrl(): string {
  return process.env.FRONTEND_URL || "http://localhost:5173";
}

function googleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/auth/google/callback";

  if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
  }

  return { clientId, clientSecret, redirectUri };
}

export async function register(req: Request, res: Response) {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    const { name, email, password, role, parentName } = parsed.data;
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) return res.status(409).json({ message: "Email already exists" });

    const hashedPassword = await hashPassword(password);
    const createdUsers = await db
      .insert(users)
      .values({ name, email, password: hashedPassword, role, parentName })
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

    const user = createdUsers[0];
    const token = signToken({ userId: user.userId, role: user.role!, email: user.email });

    return res.status(201).json({ message: "Registered successfully", user, token });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    const { email, password } = parsed.data;
    const foundUsers = await db
      .select({
        userId: users.userId,
        name: users.name,
        email: users.email,
        password: users.password,
        role: users.role,
        status: users.status,
        parentName: users.parentName,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const user = foundUsers[0];
    if (!user) return res.status(401).json({ message: "Invalid email or password" });
    if (user.status === "inactive") return res.status(403).json({ message: "User is inactive" });

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

    const token = signToken({ userId: user.userId, role: user.role!, email: user.email });

    return res.json({
      message: "Login successful",
      token,
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        parentName: user.parentName,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

export async function googleAuth(_req: Request, res: Response) {
  try {
    const { clientId, redirectUri } = googleConfig();

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
    });

    return res.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
  } catch (error) {
    return res.status(500).json({ message: "Google OAuth is not configured", error });
  }
}

export async function googleCallback(req: Request, res: Response) {
  try {
    const code = String(req.query.code || "");
    if (!code) return res.status(400).json({ message: "Missing authorization code" });

    const { clientId, clientSecret, redirectUri } = googleConfig();

    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const details = await tokenRes.text();
      return res.status(400).json({ message: "Failed to exchange Google auth code", details });
    }

    const tokenJson = (await tokenRes.json()) as { access_token?: string };
    const accessToken = tokenJson.access_token;
    if (!accessToken) {
      return res.status(400).json({ message: "Google access token not found" });
    }

    const userRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      const details = await userRes.text();
      return res.status(400).json({ message: "Failed to fetch Google user info", details });
    }

    const userJson = (await userRes.json()) as { email?: string; name?: string };
    const email = userJson.email;
    const name = userJson.name || "Google User";

    if (!email) {
      return res.status(400).json({ message: "Google account email is missing" });
    }

    const existingUsers = await db
      .select({
        userId: users.userId,
        name: users.name,
        email: users.email,
        role: users.role,
        status: users.status,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    let user = existingUsers[0];

    if (!user) {
      const generatedPassword = await hashPassword(`google_${crypto.randomUUID()}`);
      const createdUsers = await db
        .insert(users)
        .values({
          name,
          email,
          password: generatedPassword,
          role: "student",
        })
        .returning({
          userId: users.userId,
          name: users.name,
          email: users.email,
          role: users.role,
          status: users.status,
        });

      user = createdUsers[0];
    }

    const token = signToken({
      userId: user.userId,
      role: user.role ?? "student",
      email: user.email,
    });

    const redirectParams = new URLSearchParams({
      token,
      userId: String(user.userId),
      name: user.name,
      email: user.email,
      role: user.role ?? "student",
      status: user.status ?? "active",
    });

    return res.redirect(`${frontendUrl()}/auth/callback?${redirectParams.toString()}`);
  } catch (error) {
    return res.status(500).json({ message: "Google login failed", error });
  }
}
