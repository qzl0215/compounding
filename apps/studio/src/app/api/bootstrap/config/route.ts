import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { NextResponse } from "next/server";
import YAML from "yaml";
import { readProjectBrief, readProjectBriefSchema, writeProjectBrief } from "@/lib/config";
import { runBootstrapCli } from "@/lib/cli";
import { validateProjectBrief } from "@/lib/bootstrap-validation";
import type { ProjectBrief } from "@/lib/types";

export async function GET() {
  const [brief, schema] = await Promise.all([readProjectBrief(), readProjectBriefSchema()]);
  return NextResponse.json({ brief, schema });
}

export async function POST(request: Request) {
  const brief = (await request.json()) as ProjectBrief;
  const schema = await readProjectBriefSchema();
  const fieldErrors = validateProjectBrief(brief, schema);
  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json(
      { ok: false, message: "配置校验失败，未写入文件。", field_errors: fieldErrors },
      { status: 400 }
    );
  }

  const tempConfigPath = path.join(os.tmpdir(), `bootstrap-config-${Date.now()}.yaml`);
  try {
    const yaml = YAML.stringify(brief, {
      defaultStringType: "PLAIN"
    });
    await fs.writeFile(tempConfigPath, yaml, "utf8");
    const validationOutput = runBootstrapCli(["validate-config", "--config", tempConfigPath, "--target", "."]);
    const cliValidation = JSON.parse(validationOutput) as { ok: boolean; message: string; field_errors: Record<string, string> };

    if (!cliValidation.ok) {
      return NextResponse.json(
        { ok: false, message: "CLI round-trip 校验失败，未写入文件。", field_errors: cliValidation.field_errors },
        { status: 400 }
      );
    }

    await writeProjectBrief(brief);
    return NextResponse.json({
      ok: true,
      message: "项目 brief 已写入，并通过 CLI round-trip 校验。",
      field_errors: {},
      saved_at: new Date().toISOString()
    });
  } finally {
    await fs.rm(tempConfigPath, { force: true });
  }
}
