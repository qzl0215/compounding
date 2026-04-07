import { NextResponse } from "next/server";
import { getManagementAccessState, runCreateDevPreviewWithTasks } from "@/modules/releases";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const access = getManagementAccessState(request.headers);
  if (!access.allowed) {
    return NextResponse.json({ ok: false, message: access.reason }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as { ref?: string; primaryTaskId?: string; linkedTaskIds?: string[] };
  const result = runCreateDevPreviewWithTasks(body.ref || "HEAD", body.primaryTaskId || null, body.linkedTaskIds || []);
  return NextResponse.json(result, { status: result.ok ? 200 : 409 });
}
