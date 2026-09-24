import { NextResponse, type NextRequest } from "next/server";
import { AUTH_ENABLED, REGISTRATION_ENABLED } from "@/lib/config";

/**
 * Middleware handles coarse routing only: it keeps a signed-out visitor away
 * from app screens and sends each role to its own section. It reads a
 * navigation cookie that contains no health data and is not a security boundary
 * — Firestore Security Rules enforce every real permission.
 */
const NAV_COOKIE = "aive_nav";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/privacy",
  "/terms",
];
const PRIMARY_PREFIX = "/app";
const PARTNER_PREFIX = "/partner";
const ONBOARDING_PATH = "/onboarding";

function parseNav(value: string | undefined) {
  if (!value) return null;
  const [role, onboarded] = value.split(":");
  if (role !== "primary" && role !== "partner") return null;
  return { role, onboardingCompleted: onboarded === "1" };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!AUTH_ENABLED) {
    if (
      ["/", "/login", "/register", "/forgot-password", "/onboarding"].includes(
        pathname,
      )
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/app";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }
  const nav = parseNav(request.cookies.get(NAV_COOKIE)?.value);

  // Sign-up is closed: both accounts already exist.
  if (pathname === "/register" && !REGISTRATION_ENABLED) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const isPublic = PUBLIC_PATHS.includes(pathname);
  const isAuthPage = ["/login", "/register", "/forgot-password"].includes(
    pathname,
  );
  const isPrimaryArea =
    pathname.startsWith(PRIMARY_PREFIX) || pathname === ONBOARDING_PATH;
  const isPartnerArea = pathname.startsWith(PARTNER_PREFIX);

  // Signed out: everything except public pages and pairing goes to login.
  if (!nav) {
    if (isPublic || pathname.startsWith("/pair")) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const home = nav.role === "primary" ? PRIMARY_PREFIX : PARTNER_PREFIX;

  if (isAuthPage || pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname =
      nav.role === "primary" && !nav.onboardingCompleted
        ? ONBOARDING_PATH
        : home;
    return NextResponse.redirect(url);
  }

  if (nav.role === "partner" && isPrimaryArea) {
    const url = request.nextUrl.clone();
    url.pathname = PARTNER_PREFIX;
    return NextResponse.redirect(url);
  }

  if (nav.role === "primary" && isPartnerArea) {
    const url = request.nextUrl.clone();
    url.pathname = PRIMARY_PREFIX;
    return NextResponse.redirect(url);
  }

  // Primary users finish onboarding before the tracker becomes available.
  if (
    nav.role === "primary" &&
    !nav.onboardingCompleted &&
    pathname.startsWith(PRIMARY_PREFIX)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = ONBOARDING_PATH;
    return NextResponse.redirect(url);
  }

  if (
    nav.role === "primary" &&
    nav.onboardingCompleted &&
    pathname === ONBOARDING_PATH
  ) {
    const url = request.nextUrl.clone();
    url.pathname = PRIMARY_PREFIX;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|icons|manifest.webmanifest|sw.js|favicon.ico).*)",
  ],
};
