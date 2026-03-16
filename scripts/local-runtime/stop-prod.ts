const { clearLocalState, detectLocalProdStatus, stopProcess, waitForExit } = require("./lib.ts");

async function main() {
  const status = detectLocalProdStatus();

  if (!status.pid) {
    if (status.status === "unmanaged") {
      console.log(JSON.stringify({ ok: false, message: status.reason, status }, null, 2));
      process.exit(1);
    }
    clearLocalState();
    console.log(JSON.stringify({ ok: true, message: "本地生产本就未运行。", status }, null, 2));
    return;
  }

  stopProcess(status.pid);
  const stopped = await waitForExit(status.pid);
  if (!stopped) {
    process.kill(Number(status.pid), "SIGKILL");
    await waitForExit(status.pid, 2000);
  }
  clearLocalState();

  console.log(
    JSON.stringify(
      {
        ok: true,
        message: "本地生产已停止。",
        status: detectLocalProdStatus(),
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.log(JSON.stringify({ ok: false, message: error instanceof Error ? error.message : "本地生产停止失败。" }, null, 2));
  process.exit(1);
});
