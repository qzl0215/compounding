process.env.AI_OS_RUNTIME_PROFILE = "dev";
process.env.AI_OS_LOCAL_PORT = process.env.AI_OS_LOCAL_PORT || "3011";
process.env.AI_OS_LOCAL_LINK_NAME = "preview-current";
process.env.AI_OS_LOCAL_STATE_PREFIX = "local-dev";

const { detectLocalProdStatus } = require("./lib.ts");

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
    console.log(JSON.stringify({ ok: true, message: "dev 预览当前未运行，将直接拉起。", status }, null, 2));
    const started = await runScript("start-preview.ts");
    console.log(JSON.stringify(started, null, 2));
    return;
  }

  const stopped = await runScript("stop-preview.ts");
  if (!stopped.ok) {
    console.log(JSON.stringify(stopped, null, 2));
    process.exit(1);
  }

  const started = await runScript("start-preview.ts");
  if (!started.ok) {
    console.log(JSON.stringify(started, null, 2));
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        message: "dev 预览已按当前 release 最小重启。",
        status: started.status,
        check: started.check,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.log(JSON.stringify({ ok: false, message: error instanceof Error ? error.message : "dev 预览重启失败。" }, null, 2));
  process.exit(1);
});
