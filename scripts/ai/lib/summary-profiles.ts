const DEFAULT_TEE_POLICY = {
  ttl_hours: 24,
  max_files: 100,
  max_total_bytes: 100 * 1024 * 1024,
};

const DEFAULT_FALLBACK_POLICY = {
  mode: "raw_with_notice",
};

const PARSER_SLOTS = ["json_parser", "ndjson_parser", "progress_filter", "state_machine_parser"];

const SUMMARY_PROFILES = {
  preflight_summary: {
    profile_id: "preflight_summary",
    profile_version: "1",
    pipeline: ["structure_only", "stats_extraction", "error_only"],
    tee_policy: DEFAULT_TEE_POLICY,
    fallback_policy: DEFAULT_FALLBACK_POLICY,
    parser_slots: PARSER_SLOTS,
    shortcut_id: "preflight_summary",
  },
  validate_static_summary: {
    profile_id: "validate_static_summary",
    profile_version: "1",
    pipeline: ["stats_extraction", "failure_focus", "error_only", "grouping_by_pattern", "deduplication"],
    tee_policy: DEFAULT_TEE_POLICY,
    fallback_policy: DEFAULT_FALLBACK_POLICY,
    parser_slots: PARSER_SLOTS,
    shortcut_id: "validate_static_summary",
  },
  validate_build_summary: {
    profile_id: "validate_build_summary",
    profile_version: "1",
    pipeline: ["stats_extraction", "failure_focus", "error_only", "grouping_by_pattern", "deduplication"],
    tee_policy: DEFAULT_TEE_POLICY,
    fallback_policy: DEFAULT_FALLBACK_POLICY,
    parser_slots: PARSER_SLOTS,
    shortcut_id: "validate_build_summary",
  },
  review_summary: {
    profile_id: "review_summary",
    profile_version: "1",
    pipeline: ["structure_only", "failure_focus", "error_only", "grouping_by_pattern", "deduplication"],
    tee_policy: DEFAULT_TEE_POLICY,
    fallback_policy: DEFAULT_FALLBACK_POLICY,
    parser_slots: PARSER_SLOTS,
    shortcut_id: "review_summary",
  },
  preview_summary: {
    profile_id: "preview_summary",
    profile_version: "1",
    pipeline: ["structure_only", "stats_extraction", "error_only"],
    tee_policy: DEFAULT_TEE_POLICY,
    fallback_policy: DEFAULT_FALLBACK_POLICY,
    parser_slots: PARSER_SLOTS,
    shortcut_id: "preview_summary",
  },
  prod_summary: {
    profile_id: "prod_summary",
    profile_version: "1",
    pipeline: ["structure_only", "stats_extraction", "error_only"],
    tee_policy: DEFAULT_TEE_POLICY,
    fallback_policy: DEFAULT_FALLBACK_POLICY,
    parser_slots: PARSER_SLOTS,
    shortcut_id: "prod_summary",
  },
  diff_summary: {
    profile_id: "diff_summary",
    profile_version: "1",
    pipeline: ["stats_extraction"],
    tee_policy: DEFAULT_TEE_POLICY,
    fallback_policy: DEFAULT_FALLBACK_POLICY,
    parser_slots: PARSER_SLOTS,
    shortcut_id: "diff_summary",
  },
  tree_summary: {
    profile_id: "tree_summary",
    profile_version: "1",
    pipeline: ["stats_extraction"],
    tee_policy: DEFAULT_TEE_POLICY,
    fallback_policy: DEFAULT_FALLBACK_POLICY,
    parser_slots: PARSER_SLOTS,
    shortcut_id: "tree_summary",
  },
};

function getSummaryProfile(profileId) {
  return SUMMARY_PROFILES[profileId] || null;
}

module.exports = {
  SUMMARY_PROFILES,
  getSummaryProfile,
};
