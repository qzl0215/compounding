import { NextResponse } from "next/server";
import { listSkills, updateSkillStatus } from "@/modules/skills";
import type { SkillStatus } from "@/modules/skills/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const skills = await listSkills();
    return NextResponse.json({ ok: true, skills });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body as { id: string; status: SkillStatus };

    if (!id || !status) {
      return NextResponse.json(
        { ok: false, message: "Missing id or status" },
        { status: 400 }
      );
    }

    await updateSkillStatus(id, status);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
