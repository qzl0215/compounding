const { currentActiveRelease, markActive, readManifest, readRegistry, releaseReload, updateCurrentSymlink, upsertRelease, withReleaseLock } = require("./lib.ts");

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

    updateCurrentSymlink(releaseId);
    const reloadNote = releaseReload();
    markActive(releaseId, previous?.release_id || null);
    const updated = readRegistry().releases.find((item) => item.release_id === releaseId) || target;
    const finalRelease = { ...updated, notes: [...updated.notes, reloadNote] };
    upsertRelease(finalRelease);
    return { registry: readRegistry(), finalRelease };
  });

  console.log(
    JSON.stringify({
      ok: true,
      message: `Rolled back to ${releaseId}.`,
      release: result.finalRelease,
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
