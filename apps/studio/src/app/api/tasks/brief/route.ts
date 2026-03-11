import { NextResponse } from "next/server";
import { readBootstrapConfig, readProjectBrief, readResolvedBootstrapConfig } from "@/lib/config";
import { buildTaskBrief } from "@/lib/tasks";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      task_goal: string;
      expected_output: string;
      notes: string;
    };
    const brief = await readProjectBrief();
    const resolved = await readResolvedBootstrapConfig().catch(() => null);
    const taskBrief = buildTaskBrief(payload, brief, resolved ?? (await readBootstrapConfig()));
    return NextResponse.json({ ok: true, task_brief: taskBrief });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Failed to build task brief." },
      { status: 500 }
    );
  }
}
