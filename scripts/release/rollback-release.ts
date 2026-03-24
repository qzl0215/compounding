const {
  currentActiveRelease,
  materializeProdRuntime,
  markActive,
  productionBaseUrl,
  pruneInactiveProdRuntimeCopies,
  readManifest,
  readRegistry,
  releaseReload,
  run,
  updateChannelSymlink,
  upsertRelease,
  withReleaseLock,
} = require("./lib.ts");
const { stabilizeLocalProdRuntime } = require("./prod-runtime-stability.ts");

function parseArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return null;
  }
  return process.argv[index + 1] || null;
}

const releaseId = parseArg("--release");

if (!releaseId) {
  console.error(JSON.stringify({ ok: false, message: "Missing --release <release-id>." }));
  process.exit(1);
}

try {
  const result = withReleaseLock(() => {
    const previous = currentActiveRelease();
    const target = readManifest(releaseId);
    if (!target.release_path) {
      throw new Error(`Release ${releaseId} has no release path.`);
    }

    const prodRuntimePath = materializeProdRuntime(target.release_path, releaseId, target.commit_sha);
    updateChannelSymlink(prodRuntimePath, "prod");
    const reloadNote = releaseReload();
    markActive(releaseId, previous?.release_id || null);
    const stabilityNote = stabilizeLocalProdRuntime(process.cwd(), run, releaseId);
    const updated = readRegistry().releases.find((item) => item.release_id === releaseId) || target;
    const finalRelease = { ...updated, notes: [...updated.notes, reloadNote, stabilityNote].filter(Boolean) };
    upsertRelease(finalRelease);
    pruneInactiveProdRuntimeCopies(releaseId);
    return { registry: readRegistry(), finalRelease };
  });

  console.log(
    JSON.stringify({
      ok: true,
      message: `Rolled back to ${releaseId}.`,
      release: result.finalRelease,
      links: { production: productionBaseUrl() },
      registry: result.registry,
    })
  );
} catch (error) {
  console.log(
    JSON.stringify({
      ok: false,
      message: error instanceof Error ? error.message : "Rollback failed.",
    })
  );
}
