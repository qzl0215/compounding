import { NextResponse } from "next/server";
import { getManagementAccessState, readReleaseRegistry } from "@/modules/releases";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const access = getManagementAccessState(request.headers);
  if (!access.allowed) {
    return NextResponse.json({ ok: false, message: access.reason }, { status: 403 });
  }
  return NextResponse.json({ ok: true, registry: readReleaseRegistry() });
}
