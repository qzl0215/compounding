import { NextResponse } from "next/server";
import { getManagementAccessState, runDeployRelease } from "@/modules/releases";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const access = getManagementAccessState(request.headers);
  if (!access.allowed) {
    return NextResponse.json({ ok: false, message: access.reason }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as { ref?: string };
  const result = runDeployRelease(body.ref || "main");
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
