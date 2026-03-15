const { ensureReleaseTag, markActive, readManifest, readRegistry, releaseReload, updateCurrentSymlink } = require("./lib.ts");

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
  const record = readManifest(releaseId);
  if (record.build_result !== "passed" || record.smoke_result !== "passed") {
    throw new Error(`Release ${releaseId} is not healthy enough for cutover.`);
  }

  const tag = ensureReleaseTag(`release-${releaseId}`, record.commit_sha);
  updateCurrentSymlink(releaseId);
  const reloadNote = releaseReload();
  const registry = markActive(releaseId);
  const updated = readRegistry().releases.find((item) => item.release_id === releaseId) || { ...record, tag };
  updated.tag = tag;
  require("./lib.ts").upsertRelease({ ...updated, tag, notes: [...updated.notes, reloadNote] });

  console.log(
    JSON.stringify({
      ok: true,
      message: `Release ${releaseId} is now live.`,
      release: { ...updated, tag },
      registry,
    })
  );
} catch (error) {
  console.log(
    JSON.stringify({
      ok: false,
      message: error instanceof Error ? error.message : "Failed to switch release.",
    })
  );
}
