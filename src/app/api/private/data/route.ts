import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPrivateRole } from "@/lib/private/access";
import {
  PrivateAccessError,
  privateOperations,
} from "@/lib/private/operations";
import { serialize } from "@/lib/private/serialization";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const headers = { "Cache-Control": "no-store" };
  if (request.headers.get("origin") !== request.nextUrl.origin)
    return new NextResponse(null, { status: 403, headers });
  const role = await getPrivateRole();
  if (!role) return new NextResponse(null, { status: 401, headers });
  try {
    const body = await request.text();
    if (body.length > 20000)
      return new NextResponse(null, { status: 413, headers });
    const input = z
      .object({ operation: z.string(), args: z.array(z.unknown()).max(6) })
      .parse(JSON.parse(body));
    const operations = await privateOperations(role);
    if (!Object.hasOwn(operations, input.operation))
      return new NextResponse(null, { status: 400, headers });
    const data = await operations[input.operation as keyof typeof operations](
      input.args,
    );
    return NextResponse.json({ data: serialize(data ?? null) }, { headers });
  } catch (error) {
    const status =
      error instanceof PrivateAccessError
        ? 403
        : error instanceof z.ZodError || error instanceof SyntaxError
          ? 400
          : 503;
    return NextResponse.json(
      { error: "Couldn't sync right now. Try again." },
      { status, headers },
    );
  }
}
