import { NextResponse } from "next/server";
import { getManagementAccessState, runRollbackRelease } from "@/modules/releases";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const access = getManagementAccessState(request.headers);
  if (!access.allowed) {
    return NextResponse.json({ ok: false, message: access.reason }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as { releaseId?: string };
  if (!body.releaseId) {
    return NextResponse.json({ ok: false, message: "Missing releaseId." }, { status: 400 });
  }

  const result = runRollbackRelease(body.releaseId);
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
