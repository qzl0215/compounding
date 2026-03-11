import { NextResponse } from "next/server";
import { runBootstrapCli } from "@/lib/cli";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    runBootstrapCli(["apply-proposal", "--proposal", id, "--target", "."]);
    return NextResponse.json({ ok: true, message: `Proposal ${id} applied and committed.` });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Failed to apply proposal." },
      { status: 500 }
    );
  }
}
