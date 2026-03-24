export type MinimalReleaseRecord = {
  release_id: string;
  channel?: string | null;
  acceptance_status?: string | null;
  promoted_to_main_at?: string | null;
  promoted_from_dev_release_id?: string | null;
  created_at?: string | null;
  cutover_at?: string | null;
};

export type MinimalReleaseRegistry<TRelease extends MinimalReleaseRecord = MinimalReleaseRecord> = {
  pending_dev_release_id?: string | null;
  releases?: TRelease[] | null;
};

export function findPromotingProdRelease<TRelease extends MinimalReleaseRecord>(
  releases: readonly TRelease[],
  devReleaseId: string,
): TRelease | null {
  return (
    releases.find(
      (release) => release.channel === "prod" && String(release.promoted_from_dev_release_id || "").trim() === devReleaseId,
    ) || null
  );
}

export function isEffectivePendingDevRelease<TRelease extends MinimalReleaseRecord>(
  release: TRelease | null | undefined,
  releases: readonly TRelease[],
): release is TRelease {
  if (!release || release.channel !== "dev" || release.acceptance_status !== "pending") {
    return false;
  }
  if (release.promoted_to_main_at) {
    return false;
  }
  return !findPromotingProdRelease(releases, release.release_id);
}

export function findEffectivePendingDevRelease<TRelease extends MinimalReleaseRecord>(
  releases: readonly TRelease[],
  preferredReleaseId: string | null = null,
): TRelease | null {
  const candidates = releases
    .filter((release): release is TRelease => isEffectivePendingDevRelease(release, releases))
    .sort((left, right) => sortStamp(right).localeCompare(sortStamp(left)));

  if (preferredReleaseId) {
    const preferred = candidates.find((release) => release.release_id === preferredReleaseId);
    if (preferred) {
      return preferred;
    }
  }

  return candidates[0] || null;
}

export function reconcileReleaseRegistry<
  TRelease extends MinimalReleaseRecord,
  TRegistry extends MinimalReleaseRegistry<TRelease>,
>(registry: TRegistry): { registry: TRegistry; pendingDevRelease: TRelease | null; changed: boolean } {
  const releases = Array.isArray(registry.releases) ? registry.releases : [];
  let changed = false;

  const reconciledReleases = releases.map((release) => {
    const promotingProd = findPromotingProdRelease(releases, release.release_id);
    const promotedAt =
      release.promoted_to_main_at || promotingProd?.promoted_to_main_at || promotingProd?.cutover_at || promotingProd?.created_at || null;

    if (release.channel !== "dev" || !promotedAt) {
      return release;
    }

    const nextAcceptance = release.acceptance_status === "accepted" ? release.acceptance_status : "accepted";
    if (nextAcceptance === release.acceptance_status && promotedAt === release.promoted_to_main_at) {
      return release;
    }

    changed = true;
    return {
      ...release,
      acceptance_status: nextAcceptance,
      promoted_to_main_at: promotedAt,
    };
  });

  const pendingDevRelease = findEffectivePendingDevRelease(reconciledReleases, registry.pending_dev_release_id || null);
  const pendingDevReleaseId = pendingDevRelease?.release_id || null;
  if ((registry.pending_dev_release_id || null) !== pendingDevReleaseId) {
    changed = true;
  }

  return {
    registry: {
      ...registry,
      pending_dev_release_id: pendingDevReleaseId,
      releases: reconciledReleases,
    },
    pendingDevRelease,
    changed,
  };
}

function sortStamp(release: MinimalReleaseRecord) {
  return String(release.cutover_at || release.created_at || "");
}
