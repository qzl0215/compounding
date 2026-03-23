/**
 * Lifecycle writeback helpers for task companion contracts.
 */

const { updateCompanion } = require("./task-meta.ts");

function now() {
  return new Date().toISOString();
}

function latestDecision(decisionCard) {
  if (!decisionCard?.decision) return null;
  return {
    decision_id: decisionCard.decision_id || decisionCard.decision?.decision_id || null,
    path: decisionCard.path || null,
    type: decisionCard.decision?.decision_type || "pre_task_guard",
    generated_at: decisionCard.decision?.generated_at || now(),
  };
}

function latestDiffSummary(diffSummary) {
  if (!diffSummary?.diff_summary) return null;
  return {
    path: diffSummary.path || null,
    ref_a: diffSummary.diff_summary.ref_a,
    ref_b: diffSummary.diff_summary.ref_b,
    generated_at: diffSummary.diff_summary.generated_at || now(),
  };
}

function recordCreated(taskId, payload = {}) {
  return updateCompanion(taskId, (companion) => {
    companion.completion_mode = payload.completion_mode || companion.completion_mode || "close_full_contract";
    companion.lifecycle.created = {
      recorded_at: now(),
      source: payload.source || "coord:task:create",
      task_id: companion.task_id,
      task_path: companion.task_path,
      branch_name: companion.branch_name,
      planned_files: companion.planned_files,
    };
    return companion;
  });
}

function recordSearchEvidence(taskId, payload = {}) {
  return updateCompanion(taskId, (companion) => {
    const note = {
      recorded_at: payload.recorded_at || now(),
      source: payload.source || "coord:task:search",
      scope: payload.scope || "unfamiliar_pattern",
      sources: Array.isArray(payload.sources) ? payload.sources.map((item) => String(item || "").trim()).filter(Boolean) : [],
      conclusion: payload.conclusion || "",
    };
    companion.artifacts.search_evidence.push(note);
    return companion;
  });
}

function recordPreTaskResult(taskId, result) {
  return updateCompanion(taskId, (companion) => {
    const decision = latestDecision(result.decision_card);
    companion.lifecycle.pre_task = {
      recorded_at: now(),
      ok: Boolean(result.ok),
      preflight_check: result.preflight_check || null,
      search_check: result.search_check || null,
      runtime_check: result.runtime_check || null,
      scope_check: result.scope_check || null,
      lock_check: result.lock_check || null,
      blockers: result.blockers || [],
      decision_card: decision,
    };
    companion.locks = result.lock_check?.conflicts || [];
    if (decision) {
      companion.artifacts.decision_cards.push(decision);
    }
    return companion;
  });
}

function recordHandoff(taskId, payload = {}) {
  return updateCompanion(taskId, (companion) => {
    const note = {
      recorded_at: now(),
      source: payload.source || "coord:task:handoff",
      summary: payload.summary || `${companion.task_id} 已进入交接。`,
      git_head: payload.git_head || null,
      branch_name: payload.branch_name || companion.branch_name,
    };
    companion.lifecycle.handoff = note;
    companion.artifacts.handoff_notes.push(note);
    return companion;
  });
}

function recordReviewResult(taskId, review) {
  return updateCompanion(taskId, (companion) => {
    const diffSummary = latestDiffSummary(review.diff_summary);
    const note = {
      recorded_at: now(),
      ok: Boolean(review.ok),
      merge_decision: review.merge_decision || null,
      merge_confidence_score: review.merge_confidence_score ?? null,
      merge_decision_explanation: review.merge_decision_explanation || null,
      reviewers: review.reviewers || [],
      diff_summary_path: diffSummary?.path || null,
    };
    companion.lifecycle.review = note;
    companion.artifacts.review_notes.push(note);
    if (diffSummary) {
      companion.artifacts.diff_summaries.push(diffSummary);
    }
    return companion;
  });
}

function recordReleaseHandoff(taskId, payload = {}) {
  return updateCompanion(taskId, (companion) => {
    const note = {
      recorded_at: now(),
      source: payload.source || "release:prepare",
      channel: payload.channel || "dev",
      release_id: payload.release_id || null,
      acceptance_status: payload.acceptance_status || null,
      release_path: payload.release_path || null,
      commit_sha: payload.commit_sha || null,
      preview_url: payload.preview_url || null,
      production_url: payload.production_url || null,
      promoted_from_dev_release_id: payload.promoted_from_dev_release_id || null,
      linked_task_ids: payload.linked_task_ids || [],
      change_summary: payload.change_summary || [],
      status: payload.status || null,
    };
    companion.lifecycle.release_handoff = note;
    companion.artifacts.release_notes.push(note);
    return companion;
  });
}

module.exports = {
  recordCreated,
  recordHandoff,
  recordPreTaskResult,
  recordReleaseHandoff,
  recordReviewResult,
  recordSearchEvidence,
};
