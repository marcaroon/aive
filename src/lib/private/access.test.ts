import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@/lib/config", () => ({ AUTH_ENABLED: false }));
import {
  ACCESS_MAX_AGE,
  createAccessCookie,
  roleForLink,
  verifyAccessCookie,
} from "./access";

beforeEach(() => {
  vi.stubEnv("AIVE_PRIMARY_LINK_KEY", "a".repeat(43));
  vi.stubEnv("AIVE_PARTNER_LINK_KEY", "b".repeat(43));
});
describe("private link access", () => {
  it("keeps the two links separate and rejects unknown keys", () => {
    expect(roleForLink("a".repeat(43))).toBe("primary");
    expect(roleForLink("b".repeat(43))).toBe("partner");
    expect(roleForLink("unknown")).toBeNull();
  });
  it("rejects forged roles, signatures, expired and malformed cookies", () => {
    const cookie = createAccessCookie("partner", 1000);
    expect(verifyAccessCookie(cookie, 2000)).toBe("partner");
    expect(
      verifyAccessCookie(cookie.replace("partner", "primary"), 2000),
    ).toBeNull();
    expect(verifyAccessCookie(cookie + "x", 2000)).toBeNull();
    expect(verifyAccessCookie(cookie, (ACCESS_MAX_AGE + 2) * 1000)).toBeNull();
    expect(verifyAccessCookie(undefined)).toBeNull();
    expect(verifyAccessCookie("primary.not-a-time.invalid")).toBeNull();
  });
  it("key rotation invalidates old remembered access", () => {
    const cookie = createAccessCookie("primary");
    vi.stubEnv("AIVE_PRIMARY_LINK_KEY", "c".repeat(43));
    expect(verifyAccessCookie(cookie)).toBeNull();
    expect(roleForLink("a".repeat(43))).toBeNull();
  });
  it("fails closed for missing, short, or identical keys", () => {
    vi.stubEnv("AIVE_PRIMARY_LINK_KEY", "short");
    expect(roleForLink("short")).toBeNull();
    vi.stubEnv("AIVE_PRIMARY_LINK_KEY", "b".repeat(43));
    expect(roleForLink("b".repeat(43))).toBeNull();
  });
});
