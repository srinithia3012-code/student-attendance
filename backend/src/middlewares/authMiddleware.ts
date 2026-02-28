import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

type UserRole = "admin" | "teacher" | "student";

export interface AuthUser {
  userId: number;
  role: UserRole;
  email?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

function parseBearerToken(authHeader?: string): string | null {
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = parseBearerToken(req.headers.authorization);

  if (!token) {
    res.status(401).json({ message: "Unauthorized: missing token" });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ message: "Server configuration error: missing JWT_SECRET" });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload & Partial<AuthUser>;

    if (!decoded.userId || !decoded.role) {
      res.status(401).json({ message: "Unauthorized: invalid token payload" });
      return;
    }

    req.user = {
      userId: Number(decoded.userId),
      role: decoded.role,
      email: decoded.email,
    };

    next();
  } catch {
    res.status(401).json({ message: "Unauthorized: invalid or expired token" });
  }
}

export function authorize(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: "Forbidden: insufficient permissions" });
      return;
    }

    next();
  };
}
