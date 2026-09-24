import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { AUTH_ENABLED } from "@/lib/config";
import type { UserRole } from "@/types/user";

export const ACCESS_COOKIE = "aive_private_access";
export const ACCESS_MAX_AGE = 60 * 60 * 24 * 180;

function keyFor(role: UserRole): string | undefined {
  if (process.env.AIVE_PRIMARY_LINK_KEY === process.env.AIVE_PARTNER_LINK_KEY)
    return undefined;
  const key =
    role === "primary"
      ? process.env.AIVE_PRIMARY_LINK_KEY
      : process.env.AIVE_PARTNER_LINK_KEY;
  return key && key.length >= 32 ? key : undefined;
}

export function equalSecret(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function roleForLink(key: string): UserRole | null {
  if (AUTH_ENABLED) return null;
  for (const role of ["primary", "partner"] as const) {
    const expected = keyFor(role);
    if (expected && equalSecret(key, expected)) return role;
  }
  return null;
}

export function createAccessCookie(role: UserRole, now = Date.now()): string {
  const key = keyFor(role);
  if (!key) throw new Error("Private link is not configured.");
  const payload = `${role}.${Math.floor(now / 1000) + ACCESS_MAX_AGE}`;
  return `${payload}.${createHmac("sha256", key).update(payload).digest("base64url")}`;
}

export function verifyAccessCookie(
  value: string | undefined,
  now = Date.now(),
): UserRole | null {
  if (AUTH_ENABLED || !value) return null;
  const [role, expires, signature, extra] = value.split(".");
  if (
    extra ||
    (role !== "primary" && role !== "partner") ||
    !signature ||
    !/^\d+$/.test(expires ?? "")
  )
    return null;
  const key = keyFor(role);
  if (!key || Number(expires) <= Math.floor(now / 1000)) return null;
  const expected = createHmac("sha256", key)
    .update(`${role}.${expires}`)
    .digest("base64url");
  return equalSecret(signature, expected) ? role : null;
}

export async function getPrivateRole(): Promise<UserRole | null> {
  return verifyAccessCookie((await cookies()).get(ACCESS_COOKIE)?.value);
}
