import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_jwt_key_123456";

export interface UserJWTPayload {
  userId: string;
  email: string;
  name: string;
  role: "FOUNDER" | "CO-FOUNDER" | "MANAGER" | "EDITOR" | "PHOTOGRAPHER" | "VIDEOGRAPHER" | "INTERN";
}

export function signJWT(payload: UserJWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyJWT(token: string): UserJWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserJWTPayload;
  } catch (error) {
    return null;
  }
}

export function getAuthUser(req: NextRequest): UserJWTPayload | null {
  const cookieToken = req.cookies.get("token")?.value;
  if (!cookieToken) {
    // Check Authorization Header fallback
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      return verifyJWT(authHeader.substring(7));
    }
    return null;
  }
  return verifyJWT(cookieToken);
}

export function hasPermission(
  userRole: string,
  requiredRoles: ("FOUNDER" | "CO-FOUNDER" | "MANAGER" | "EDITOR" | "PHOTOGRAPHER" | "VIDEOGRAPHER" | "INTERN")[]
): boolean {
  return requiredRoles.includes(userRole as any);
}
