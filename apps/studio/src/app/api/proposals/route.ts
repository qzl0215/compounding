import { NextResponse } from "next/server";
import { createPromptFile, runBootstrapCli } from "@/lib/cli";
import { listProposalBundles } from "@/lib/proposals";

export async function GET() {
  const proposals = await listProposalBundles();
  return NextResponse.json({ proposals });
}

export async function POST(request: Request) {
  try {
    const { prompt } = (await request.json()) as { prompt: string };
    const promptFile = await createPromptFile(prompt);
    const proposalId = runBootstrapCli(["propose", "--config", "bootstrap/project_brief.yaml", "--target", ".", "--prompt-file", promptFile]);
    return NextResponse.json({ ok: true, message: "Review 已生成，系统尚未改写仓库文件。", proposal_id: proposalId.trim() });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Failed to generate proposal." },
      { status: 500 }
    );
  }
}
