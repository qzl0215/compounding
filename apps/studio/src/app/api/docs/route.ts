import { NextResponse } from "next/server";
import { writeDoc } from "@/modules/docs";
import { getManagementAccessState } from "@/modules/releases";

export const dynamic = "force-dynamic";

type SaveBody = {
  path?: string;
  content?: string;
  mode?: "body" | "raw";
};

export async function PUT(request: Request) {
  const access = getManagementAccessState(request.headers);
  if (!access.allowed) {
    return NextResponse.json({ ok: false, message: access.reason }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as SaveBody;
  if (!body.path || typeof body.content !== "string") {
    return NextResponse.json({ ok: false, message: "Missing path or content." }, { status: 400 });
  }

  try {
    const doc = await writeDoc(body.path, body.content, body.mode === "body" ? "body" : "raw");
    return NextResponse.json({ ok: true, doc });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save document.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
