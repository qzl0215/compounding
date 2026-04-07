const { PROFILE_LABEL, detectLocalProdStatus } = require("./lib.ts");

async function runScript(script) {
  const { execFileSync } = require("node:child_process");
  const { join } = require("node:path");
  const output = execFileSync("node", ["--experimental-strip-types", join(process.cwd(), "scripts", "local-runtime", script)], {
    cwd: process.cwd(),
    encoding: "utf8",
  }).trim();
  return JSON.parse(output);
}

async function main() {
  const status = detectLocalProdStatus();

  if (status.status === "unmanaged") {
    console.log(JSON.stringify({ ok: false, message: status.reason, status }, null, 2));
    process.exit(1);
  }

  if (status.status === "stopped" || status.status === "stale_pid") {
    console.log(JSON.stringify({ ok: true, message: `${PROFILE_LABEL}当前未运行，按约定不自动拉起。`, status }, null, 2));
    return;
  }

  const stopped = await runScript("stop-prod.ts");
  if (!stopped.ok) {
    console.log(JSON.stringify(stopped, null, 2));
    process.exit(1);
  }

  const started = await runScript("start-prod.ts");
  if (!started.ok) {
    console.log(JSON.stringify(started, null, 2));
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        message: `${PROFILE_LABEL}已按当前 release 最小重启。`,
        status: started.status,
        check: started.check,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.log(JSON.stringify({ ok: false, message: error instanceof Error ? error.message : `${PROFILE_LABEL}重启失败。` }, null, 2));
  process.exit(1);
});
