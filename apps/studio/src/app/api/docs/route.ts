import { NextResponse } from "next/server";
import { writeMarkdownDoc } from "@/modules/docs";
import { getManagementAccessState } from "@/modules/releases";

export const dynamic = "force-dynamic";

type SaveBody = {
  path?: string;
  rawContent?: string;
};

export async function PUT(request: Request) {
  const access = getManagementAccessState(request.headers);
  if (!access.allowed) {
    return NextResponse.json({ ok: false, message: access.reason }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as SaveBody;
  if (!body.path || typeof body.rawContent !== "string") {
    return NextResponse.json({ ok: false, message: "Missing path or rawContent." }, { status: 400 });
  }

  try {
    const doc = await writeMarkdownDoc(body.path, body.rawContent);
    return NextResponse.json({ ok: true, doc });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save document.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
