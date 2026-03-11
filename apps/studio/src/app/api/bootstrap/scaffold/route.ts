import { NextResponse } from "next/server";
import { runBootstrapCli } from "@/lib/cli";

export async function POST() {
  try {
    runBootstrapCli(["scaffold", "--config", "bootstrap/project_brief.yaml", "--target", "."]);
    return NextResponse.json({ ok: true, message: "初始化完成，项目作战卡与轻量知识内核已刷新。" });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Scaffold failed." },
      { status: 500 }
    );
  }
}
