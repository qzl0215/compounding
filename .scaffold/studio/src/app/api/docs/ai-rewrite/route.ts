import { NextResponse } from "next/server";
import { runDocRewriteAction } from "@/modules/docs/ai-rewrite";
import { getManagementAccessState } from "@/modules/releases";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const access = getManagementAccessState(request.headers);
  if (!access.allowed) {
    return NextResponse.json({ ok: false, message: access.reason }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    action?: "clarify" | "rewrite";
    path?: string;
    content?: string;
    intensity?: "light" | "medium" | "heavy";
    answers?: string;
  };

  if (!body.action || !body.path || typeof body.content !== "string") {
    return NextResponse.json({ ok: false, message: "Missing action, path or content." }, { status: 400 });
  }

  try {
    const result = await runDocRewriteAction({
      action: body.action,
      path: body.path,
      content: body.content,
      intensity: body.intensity || "medium",
      answers: body.answers || "",
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI rewrite failed.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
