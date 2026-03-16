const { clearLocalState, detectLocalProdStatus, spawnLocalProduction, stopProcess, waitForExit, waitForHealthyRuntime } = require("./lib.ts");

async function main() {
  const status = detectLocalProdStatus();

  if (status.status === "unmanaged") {
    console.log(JSON.stringify({ ok: false, message: status.reason, status }, null, 2));
    process.exit(1);
  }

  if (status.status === "running") {
    console.log(JSON.stringify({ ok: true, message: "本地生产已经在运行。", status }, null, 2));
    return;
  }

  if (status.status === "drift" || status.status === "port_error") {
    if (status.pid) {
      stopProcess(status.pid);
      await waitForExit(status.pid);
    }
    clearLocalState();
  }

  if (status.status === "stale_pid") {
    clearLocalState();
  }

  const { state } = spawnLocalProduction();
  const readiness = await waitForHealthyRuntime();

  if (!readiness.ok) {
    if (state.pid) {
      stopProcess(state.pid);
      await waitForExit(state.pid);
    }
    clearLocalState();
    console.log(
      JSON.stringify(
        {
          ok: false,
          message: readiness.status.reason || "本地生产启动失败。",
          status: readiness.status,
          check: readiness.check,
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        message: "本地生产已启动并通过健康检查。",
        status: readiness.status,
        check: readiness.check,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.log(JSON.stringify({ ok: false, message: error instanceof Error ? error.message : "本地生产启动失败。" }, null, 2));
  process.exit(1);
});
