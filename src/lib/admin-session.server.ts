// Server-only admin session helpers. Signed cookie using SESSION_SECRET.
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE = "admin_session";
const MAX_AGE = 60 * 60 * 8; // 8 hours

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function issueAdminSession(): void {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET not configured");
  const issuedAt = Date.now().toString();
  const sig = sign(issuedAt, secret);
  setCookie(COOKIE, `${issuedAt}.${sig}`, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export function clearAdminSession(): void {
  deleteCookie(COOKIE, { path: "/" });
}

export function isAdminAuthenticated(): boolean {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;
  const raw = getCookie(COOKIE);
  if (!raw) return false;
  const [issuedAt, sig] = raw.split(".");
  if (!issuedAt || !sig) return false;
  const expected = sign(issuedAt, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  if (!timingSafeEqual(a, b)) return false;
  const age = Date.now() - Number(issuedAt);
  if (!Number.isFinite(age) || age < 0 || age > MAX_AGE * 1000) return false;
  return true;
}

export function requireAdmin(): void {
  if (!isAdminAuthenticated()) {
    throw new Error("UNAUTHORIZED");
  }
}
