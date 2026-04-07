const fs = require("node:fs");
const path = require("node:path");
const childProcess = require("node:child_process");
const { getKnowledgeAssets, hasBundledSourceOfTruth, loadPromptManifest } = require("./knowledge-assets.ts");
const { renderAssetMaintenanceDoc } = require("../generate-asset-maintenance.ts");

function normalizePathRef(value) {
  return String(value || "")
    .trim()
    .replace(/^\.?\//, "")
    .replace(/\\/g, "/");
}

function parseFrontmatter(content) {
  const lines = String(content || "").split(/\r?\n/);
  if (lines[0]?.trim() !== "---") {
    return { hasFrontmatter: false, data: {} };
  }

  const data = {};
  let currentKey = "";
  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim() === "---") {
      return { hasFrontmatter: true, data };
    }

    const keyMatch = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (keyMatch) {
      currentKey = keyMatch[1];
      const value = keyMatch[2].trim();
      data[currentKey] = value ? value : [];
      continue;
    }

    const listMatch = line.match(/^\s*-\s*(.+)$/);
    if (listMatch && currentKey) {
      if (!Array.isArray(data[currentKey])) {
        const existing = String(data[currentKey] || "").trim();
        data[currentKey] = existing ? [existing] : [];
      }
      data[currentKey].push(listMatch[1].trim());
    }
  }

  return { hasFrontmatter: false, data: {} };
}

function asArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }
  const text = String(value || "").trim();
  return text ? [text] : [];
}

function fileExists(root, relPath) {
  return fs.existsSync(path.join(root, normalizePathRef(relPath)));
}

function isPathReference(value) {
  const normalized = normalizePathRef(value);
  if (!normalized) {
    return false;
  }
  if (normalized.includes("://") || normalized.startsWith("mailto:")) {
    return false;
  }
  if (normalized === "workspace filesystem" || normalized.startsWith("frontmatter.")) {
    return false;
  }
  return true;
}

function parseIsoDate(value) {
  const text = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return null;
  }
  const date = new Date(`${text}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysSince(date) {
  const now = new Date();
  const utcNow = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const utcDate = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.max(0, Math.floor((utcNow - utcDate) / 86400000));
}

function git(args, root) {
  return childProcess.execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
}

function loadHeadFrontmatter(root, relPath) {
  try {
    const headContent = git(["show", `HEAD:${normalizePathRef(relPath)}`], root);
    return parseFrontmatter(headContent);
  } catch {
    return null;
  }
}

function fileChangedSinceHead(root, relPath) {
  try {
    const output = git(["diff", "--name-only", "--", normalizePathRef(relPath)], root);
    return output
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean)
      .includes(normalizePathRef(relPath));
  } catch {
    return false;
  }
}

function computeQualityGrade(errors, warnings) {
  if (errors.length === 0 && warnings.length === 0) {
    return "A";
  }
  if (errors.length === 0) {
    return warnings.length <= 3 ? "B" : "C";
  }
  return errors.length <= 2 ? "D" : "F";
}

function collectKnowledgeAssetHealth(root = process.cwd(), options = {}) {
  const strict = Boolean(options.strict);
  const errors = [];
  const warnings = [];
  const promptManifest = loadPromptManifest(root);
  const details = {
    asset_ids: [],
    prompt_manifest_count: 0,
    strict,
    files: [],
    stale_files: [],
    review_bump_missing: [],
    related_doc_errors: [],
  };

  details.prompt_manifest_count = promptManifest.length;

  if (!Array.isArray(promptManifest) || promptManifest.length === 0) {
    errors.push("Prompt manifest is missing or empty: docs/prompts/prompt-assets.json");
  } else {
    for (const asset of promptManifest) {
      if (!asset.id || !asset.file || !Array.isArray(asset.required_sections)) {
        errors.push(`Prompt manifest entry is incomplete: ${JSON.stringify(asset)}`);
        continue;
      }
      const filePath = path.join(root, "docs", "prompts", asset.file);
      if (!fs.existsSync(filePath)) {
        errors.push(`Prompt manifest references missing file: docs/prompts/${asset.file}`);
      }
    }
  }

  const assetMaintenancePath = path.join(root, "docs", "ASSET_MAINTENANCE.md");
  if (!fs.existsSync(assetMaintenancePath)) {
    errors.push("Missing generated asset maintenance doc: docs/ASSET_MAINTENANCE.md");
  } else {
    const committed = fs.readFileSync(assetMaintenancePath, "utf8");
    const regenerated = renderAssetMaintenanceDoc(root);
    if (committed !== regenerated) {
      errors.push("docs/ASSET_MAINTENANCE.md is not in sync with scripts/ai/generate-asset-maintenance.ts");
    }
  }

  for (const asset of getKnowledgeAssets(root)) {
    details.asset_ids.push(asset.id);
    if (hasBundledSourceOfTruth(asset.source_of_truth)) {
      errors.push(`Knowledge asset ${asset.id} must use a single source_of_truth owner.`);
    }

    const freshnessPolicy = asset.freshness_policy || null;
    const metadataPolicy = asset.metadata_policy || null;

    for (const relFile of asset.files) {
      const normalizedFile = normalizePathRef(relFile);
      const absoluteFile = path.join(root, normalizedFile);
      const fileDetail = {
        asset_id: asset.id,
        file: normalizedFile,
        maintenance_mode: asset.maintenance_mode,
        stale: false,
        days_since_review: null,
        freshness_window_days: freshnessPolicy?.window_days || null,
        strict_failure: Boolean(freshnessPolicy?.strict_failure),
        review_bump_missing: false,
        missing_frontmatter_fields: [],
        related_docs_missing: [],
      };

      if (!fs.existsSync(absoluteFile)) {
        errors.push(`Knowledge asset ${asset.id} references missing file: ${normalizedFile}`);
        details.files.push(fileDetail);
        continue;
      }

      const content = fs.readFileSync(absoluteFile, "utf8");
      const frontmatter = parseFrontmatter(content);
      if (metadataPolicy) {
        if (!frontmatter.hasFrontmatter) {
          errors.push(`${normalizedFile}: missing frontmatter.`);
          fileDetail.missing_frontmatter_fields = metadataPolicy.required_frontmatter_fields.slice();
        } else {
          for (const field of metadataPolicy.required_frontmatter_fields || []) {
            const value = frontmatter.data[field];
            const hasValue = Array.isArray(value) ? value.length > 0 : Boolean(String(value || "").trim());
            if (!hasValue) {
              fileDetail.missing_frontmatter_fields.push(field);
              errors.push(`${normalizedFile}: missing frontmatter field "${field}".`);
            }
          }

          if (metadataPolicy.validate_source_of_truth_path) {
            const sourceOfTruth = String(frontmatter.data.source_of_truth || "").trim();
            if (isPathReference(sourceOfTruth) && !fileExists(root, sourceOfTruth)) {
              errors.push(`${normalizedFile}: source_of_truth references missing path "${sourceOfTruth}".`);
            }
          }

          if (metadataPolicy.validate_related_docs) {
            for (const relatedDoc of asArray(frontmatter.data.related_docs)) {
              const relatedPath = normalizePathRef(String(relatedDoc).replace(/#.*$/, ""));
              if (!relatedPath || !isPathReference(relatedPath)) {
                continue;
              }
              if (!fileExists(root, relatedPath)) {
                fileDetail.related_docs_missing.push(relatedPath);
                details.related_doc_errors.push({ file: normalizedFile, related_doc: relatedPath });
                errors.push(`${normalizedFile}: related_docs references missing path "${relatedPath}".`);
              }
            }
          }

          if (
            metadataPolicy.require_review_bump_on_change &&
            String(frontmatter.data.update_mode || "").trim() !== "generated" &&
            fileChangedSinceHead(root, normalizedFile)
          ) {
            const previousFrontmatter = loadHeadFrontmatter(root, normalizedFile);
            const currentReviewedAt = String(frontmatter.data.last_reviewed_at || "").trim();
            const previousReviewedAt = String(previousFrontmatter?.data?.last_reviewed_at || "").trim();
            if (previousReviewedAt && currentReviewedAt && previousReviewedAt === currentReviewedAt) {
              fileDetail.review_bump_missing = true;
              details.review_bump_missing.push(normalizedFile);
              errors.push(`${normalizedFile}: changed manual doc must update last_reviewed_at.`);
            }
          }
        }
      }

      if (freshnessPolicy && frontmatter.hasFrontmatter) {
        const reviewedAt = parseIsoDate(frontmatter.data.last_reviewed_at);
        if (!reviewedAt) {
          errors.push(`${normalizedFile}: last_reviewed_at must be YYYY-MM-DD.`);
        } else {
          fileDetail.days_since_review = daysSince(reviewedAt);
          if (fileDetail.days_since_review > freshnessPolicy.window_days) {
            fileDetail.stale = true;
            details.stale_files.push({
              asset_id: asset.id,
              file: normalizedFile,
              days_since_review: fileDetail.days_since_review,
              freshness_window_days: freshnessPolicy.window_days,
              strict_failure: Boolean(freshnessPolicy.strict_failure),
            });
            const message = `${normalizedFile}: last reviewed ${fileDetail.days_since_review} days ago, outside ${freshnessPolicy.window_days}-day freshness window.`;
            if (strict && freshnessPolicy.strict_failure) {
              errors.push(message);
            } else {
              warnings.push(message);
            }
          }
        }
      }

      details.files.push(fileDetail);
    }
  }

  return {
    ok: errors.length === 0,
    layer: "knowledge-assets",
    strict,
    quality_grade: computeQualityGrade(errors, warnings),
    errors,
    warnings,
    details,
  };
}

module.exports = {
  collectKnowledgeAssetHealth,
  parseFrontmatter,
};
