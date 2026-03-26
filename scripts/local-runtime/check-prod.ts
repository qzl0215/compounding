const { checkLocalProduction, detectLocalProdStatus } = require("./lib.ts");
const { recordShortcutOpportunityFromEnv } = require("../ai/lib/command-gain.ts");

async function main() {
  const runtimeProfile = process.env.AI_OS_RUNTIME_PROFILE === "dev" ? "preview" : "prod";
  const status = detectLocalProdStatus();
  const check = await checkLocalProduction();

  const ok = status.status === "running" && check.ok;
  recordShortcutOpportunityFromEnv(process.cwd(), {
    shortcutId: runtimeProfile === "preview" ? "preview_summary" : "prod_summary",
    originalCmd: runtimeProfile === "preview" ? "pnpm preview:check" : "pnpm prod:check",
    profileId: runtimeProfile === "preview" ? "preview_summary" : "prod_summary",
    profileVersion: "1",
    exitCode: ok ? 0 : 1,
  });
  console.log(
    JSON.stringify(
      {
        ok,
        status,
        check,
        message: ok ? "本地生产健康检查通过。" : "本地生产健康检查失败。",
      },
      null,
      2
    )
  );

  if (!ok) {
    process.exit(1);
  }
}

main().catch((error) => {
  const runtimeProfile = process.env.AI_OS_RUNTIME_PROFILE === "dev" ? "preview" : "prod";
  recordShortcutOpportunityFromEnv(process.cwd(), {
    shortcutId: runtimeProfile === "preview" ? "preview_summary" : "prod_summary",
    originalCmd: runtimeProfile === "preview" ? "pnpm preview:check" : "pnpm prod:check",
    profileId: runtimeProfile === "preview" ? "preview_summary" : "prod_summary",
    profileVersion: "1",
    exitCode: 1,
  });
  console.log(JSON.stringify({ ok: false, message: error instanceof Error ? error.message : "本地生产健康检查失败。" }, null, 2));
  process.exit(1);
});
