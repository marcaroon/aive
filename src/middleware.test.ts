import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});
describe("authentication mode routing", () => {
  it("hides every legacy auth entry point in private-link mode", async () => {
    vi.stubEnv("NEXT_PUBLIC_AUTH_ENABLED", "false");
    vi.resetModules();
    const { middleware } = await import("./middleware");
    for (const route of [
      "/",
      "/login",
      "/register",
      "/forgot-password",
      "/onboarding",
    ]) {
      expect(
        middleware(new NextRequest(`https://aive.example${route}`)).headers.get(
          "location",
        ),
      ).toBe("https://aive.example/app");
    }
    expect(
      middleware(new NextRequest("https://aive.example/partner")).headers.get(
        "location",
      ),
    ).toBeNull();
    expect(
      middleware(new NextRequest("https://aive.example/open")).headers.get(
        "location",
      ),
    ).toBeNull();
  });
  it("restores login guards when the flag is re-enabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_AUTH_ENABLED", "true");
    vi.resetModules();
    const { middleware } = await import("./middleware");
    expect(
      middleware(new NextRequest("https://aive.example/app")).headers.get(
        "location",
      ),
    ).toBe("https://aive.example/login");
    expect(
      middleware(new NextRequest("https://aive.example/login")).headers.get(
        "location",
      ),
    ).toBeNull();
  });
});
