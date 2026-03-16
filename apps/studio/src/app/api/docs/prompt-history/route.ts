import { NextResponse } from "next/server";
import { listPromptHistory, rollbackPromptDoc } from "@/modules/docs";
import { getManagementAccessState } from "@/modules/releases";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const access = getManagementAccessState(request.headers);
  if (!access.allowed) {
    return NextResponse.json({ ok: false, message: access.reason }, { status: 403 });
  }

  const url = new URL(request.url);
  const path = url.searchParams.get("path");
  if (!path) {
    return NextResponse.json({ ok: false, message: "Missing path." }, { status: 400 });
  }

  const history = await listPromptHistory(path);
  return NextResponse.json({ ok: true, history });
}

export async function POST(request: Request) {
  const access = getManagementAccessState(request.headers);
  if (!access.allowed) {
    return NextResponse.json({ ok: false, message: access.reason }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as { path?: string; versionId?: string };
  if (!body.path || !body.versionId) {
    return NextResponse.json({ ok: false, message: "Missing path or versionId." }, { status: 400 });
  }

  try {
    const doc = await rollbackPromptDoc(body.path, body.versionId);
    return NextResponse.json({ ok: true, doc });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Rollback failed.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
