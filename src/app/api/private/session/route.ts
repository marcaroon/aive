import { NextResponse } from "next/server";
import { getPrivateRole } from "@/lib/private/access";
import { privateProfile } from "@/lib/private/operations";
import { serialize } from "@/lib/private/serialization";

export const runtime = "nodejs";
export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  const role = await getPrivateRole();
  if (!role)
    return NextResponse.json(
      {
        error:
          "Open your personal Aivé link on this device to access your space.",
      },
      { status: 401, headers },
    );
  try {
    return NextResponse.json(
      { profile: serialize(await privateProfile(role)) },
      { headers },
    );
  } catch {
    return NextResponse.json(
      {
        error:
          "Your space couldn't connect. Check the server's Firebase settings and try again.",
      },
      { status: 503, headers },
    );
  }
}
