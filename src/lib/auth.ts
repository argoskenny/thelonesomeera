import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_token";
const DEFAULT_ADMIN_PASSWORD = "changeme";
const MIN_SECRET_LENGTH = 32;
const AUTH_CONFIG_ERROR = "管理員認證尚未設定";

export function getAuthConfigurationError() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const jwtSecret = process.env.JWT_SECRET;

  if (!adminPassword || adminPassword === DEFAULT_ADMIN_PASSWORD) {
    return AUTH_CONFIG_ERROR;
  }

  if (!jwtSecret || jwtSecret.length < MIN_SECRET_LENGTH) {
    return AUTH_CONFIG_ERROR;
  }

  return null;
}

export function verifyAdminPassword(password: unknown) {
  return (
    typeof password === "string" &&
    !getAuthConfigurationError() &&
    password === process.env.ADMIN_PASSWORD
  );
}

function getJwtSecret() {
  const configError = getAuthConfigurationError();
  if (configError) {
    throw new Error(configError);
  }

  return new TextEncoder().encode(process.env.JWT_SECRET);
}

export async function signToken() {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload;
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function createCookieOptions(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 天
  };
}

export function deleteCookieOptions() {
  return {
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}
