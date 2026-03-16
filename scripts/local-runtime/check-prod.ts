const { checkLocalProduction, detectLocalProdStatus } = require("./lib.ts");

async function main() {
  const status = detectLocalProdStatus();
  const check = await checkLocalProduction();

  const ok = status.status === "running" && check.ok;
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
  console.log(JSON.stringify({ ok: false, message: error instanceof Error ? error.message : "本地生产健康检查失败。" }, null, 2));
  process.exit(1);
});
