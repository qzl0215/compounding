const {
  ensureReleaseTag,
  markActive,
  productionBaseUrl,
  readManifest,
  readRegistry,
  releaseReload,
  run,
  updateChannelSymlink,
  upsertRelease,
  withReleaseLock,
} = require("./lib.ts");
const { recordReleaseHandoff } = require("../coord/lib/companion-lifecycle.ts");
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
      const record = readManifest(releaseId);
      if (record.build_result !== "passed" || record.smoke_result !== "passed") {
        throw new Error(`Release ${releaseId} is not healthy enough for cutover.`);
      }

      const tag = ensureReleaseTag(`release-${releaseId}`, record.commit_sha);
      updateChannelSymlink(record.release_path, "prod");
      markActive(releaseId);
      const reloadNote = releaseReload();
      const stabilityNote = stabilizeLocalProdRuntime(process.cwd(), run, releaseId);
      const updated = readRegistry().releases.find((item) => item.release_id === releaseId) || { ...record, tag };
      const finalRelease = { ...updated, tag, notes: [...updated.notes, reloadNote, stabilityNote].filter(Boolean) };
      upsertRelease(finalRelease);
      if (record.primary_task_id) {
        recordReleaseHandoff(record.primary_task_id, {
          source: "release:switch",
          channel: "prod",
          release_id: releaseId,
          acceptance_status: "accepted",
          release_path: record.release_path,
          commit_sha: record.commit_sha,
          production_url: productionBaseUrl(),
          linked_task_ids: record.linked_task_ids,
          change_summary: finalRelease.change_summary,
          status: "active",
        });
      }
      return { registry: readRegistry(), finalRelease };
    });

  console.log(
    JSON.stringify({
      ok: true,
      message: `Release ${releaseId} is now live.`,
      release: result.finalRelease,
      links: { production: productionBaseUrl() },
      registry: result.registry,
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
