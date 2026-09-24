import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  ACCESS_MAX_AGE,
  createAccessCookie,
  roleForLink,
} from "@/lib/private/access";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin)
    return new NextResponse(null, { status: 403 });
  const body = await request.json().catch(() => null);
  const role = typeof body?.key === "string" ? roleForLink(body.key) : null;
  if (!role)
    return NextResponse.json(
      { error: "This link is unavailable." },
      { status: 403 },
    );
  const response = NextResponse.json({
    home: role === "primary" ? "/app" : "/partner",
  });
  response.headers.set("Cache-Control", "no-store");
  response.cookies.set(ACCESS_COOKIE, createAccessCookie(role), {
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "strict",
    path: "/",
    maxAge: ACCESS_MAX_AGE,
  });
  return response;
}
