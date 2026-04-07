import fs from "node:fs";
import path from "node:path";
import { loadSimpleYamlFile, validateSimpleSchema, type SimpleSchema } from "./simple-yaml.ts";

export type DerivedAssetFamilyId = "code_index" | "output" | "coordination" | "runtime";
export type DerivedAssetTruthRole = "derived" | "transient" | "runtime";

export type DerivedAssetFamilyContract = {
  family_id: DerivedAssetFamilyId;
  path_globs: string[];
  truth_role: DerivedAssetTruthRole;
  producer: string[];
  allowed_readers: string[];
  writeback_targets: string[];
  freshness_or_ttl: string;
  ignore_as_truth: boolean;
};

export type DerivedAssetContractSpec = {
  version: string;
  families: DerivedAssetFamilyContract[];
};

const DERIVED_ASSET_CONTRACT_PATH = path.join("kernel", "derived-asset-contract.yaml");
const DERIVED_ASSET_CONTRACT_SCHEMA_PATH = path.join("schemas", "derived-asset-contract.schema.yaml");

const cache = new Map<string, DerivedAssetContractSpec>();

const EXPECTED_FAMILIES: Record<DerivedAssetFamilyId, { truth_role: DerivedAssetTruthRole; path_glob: string }> = {
  code_index: { truth_role: "derived", path_glob: "code_index/**" },
  output: { truth_role: "transient", path_glob: "output/**" },
  coordination: { truth_role: "runtime", path_glob: "agent-coordination/**" },
  runtime: { truth_role: "runtime", path_glob: ".compounding-runtime/**" },
};

function resolveProjectRoot(root = process.cwd()) {
  let cursor = path.resolve(root);
  while (true) {
    const specCandidate = path.join(cursor, DERIVED_ASSET_CONTRACT_PATH);
    const schemaCandidate = path.join(cursor, DERIVED_ASSET_CONTRACT_SCHEMA_PATH);
    if (fs.existsSync(specCandidate) && fs.existsSync(schemaCandidate)) {
      return cursor;
    }
    const parent = path.dirname(cursor);
    if (!parent || parent === cursor) {
      return path.resolve(root);
    }
    cursor = parent;
  }
}

function rootKey(root = process.cwd()) {
  return resolveProjectRoot(root);
}

function contractPath(root = process.cwd()) {
  return path.join(resolveProjectRoot(root), DERIVED_ASSET_CONTRACT_PATH);
}

function schemaPath(root = process.cwd()) {
  return path.join(resolveProjectRoot(root), DERIVED_ASSET_CONTRACT_SCHEMA_PATH);
}

function normalizePath(value: string) {
  return String(value || "").trim().replace(/\\/g, "/").replace(/^\.?\//, "");
}

function globBase(glob: string) {
  return normalizePath(glob).replace(/\/\*\*?$/, "");
}

function matchesGlob(relPath: string, glob: string) {
  const normalized = normalizePath(relPath);
  const base = globBase(glob);
  return normalized === base || normalized.startsWith(`${base}/`);
}

function validateContractShape(spec: DerivedAssetContractSpec) {
  const errors: string[] = [];
  const familyIds = new Set<DerivedAssetFamilyId>(spec.families.map((family) => family.family_id));

  for (const familyId of Object.keys(EXPECTED_FAMILIES) as DerivedAssetFamilyId[]) {
    if (!familyIds.has(familyId)) {
      errors.push(`Missing derived asset family: ${familyId}`);
    }
  }

  const seenFamilies = new Set<string>();
  for (const family of spec.families) {
    const expected = EXPECTED_FAMILIES[family.family_id];
    if (seenFamilies.has(family.family_id)) {
      errors.push(`Duplicate derived asset family: ${family.family_id}`);
      continue;
    }
    seenFamilies.add(family.family_id);

    if (!family.path_globs.length) {
      errors.push(`${family.family_id}: path_globs cannot be empty.`);
    }
    if (!family.producer.length) {
      errors.push(`${family.family_id}: producer cannot be empty.`);
    }
    if (!family.allowed_readers.length) {
      errors.push(`${family.family_id}: allowed_readers cannot be empty.`);
    }
    if (!family.freshness_or_ttl.trim()) {
      errors.push(`${family.family_id}: freshness_or_ttl cannot be empty.`);
    }
    if (family.ignore_as_truth !== true) {
      errors.push(`${family.family_id}: ignore_as_truth must be true.`);
    }
    if (expected && family.truth_role !== expected.truth_role) {
      errors.push(`${family.family_id}: truth_role must be ${expected.truth_role}.`);
    }
    if (expected && !family.path_globs.some((glob) => globBase(glob) === globBase(expected.path_glob))) {
      errors.push(`${family.family_id}: path_globs must include ${expected.path_glob}.`);
    }
  }

  return errors;
}

export function loadDerivedAssetContract(root = process.cwd()): DerivedAssetContractSpec {
  const key = rootKey(root);
  const cached = cache.get(key);
  if (cached) return cached;

  const spec = loadSimpleYamlFile<DerivedAssetContractSpec>(contractPath(root));
  const schema = loadSimpleYamlFile<SimpleSchema>(schemaPath(root));
  const schemaErrors = validateSimpleSchema(spec, schema);
  if (schemaErrors.length > 0) {
    throw new Error(`Invalid derived asset contract schema:\n${schemaErrors.join("\n")}`);
  }

  const errors = validateContractShape(spec);
  if (errors.length > 0) {
    throw new Error(`Invalid derived asset contract:\n${errors.join("\n")}`);
  }

  cache.set(key, spec);
  return spec;
}

export function clearDerivedAssetContractCache() {
  cache.clear();
}

export function normalizeDerivedAssetPath(value: string) {
  return normalizePath(value);
}

export function getDerivedAssetFamilyForPath(relPath: string, root = process.cwd()): DerivedAssetFamilyContract | null {
  const normalized = normalizeDerivedAssetPath(relPath);
  return loadDerivedAssetContract(root).families.find((family) =>
    family.path_globs.some((glob) => matchesGlob(normalized, glob)),
  ) || null;
}

export function isDerivedAssetPath(relPath: string, root = process.cwd()) {
  return Boolean(getDerivedAssetFamilyForPath(relPath, root));
}

export function getDerivedAssetObservationIgnoredPrefixes(root = process.cwd()) {
  return loadDerivedAssetContract(root).families
    .filter((family) => family.truth_role !== "derived")
    .flatMap((family) => family.path_globs.map((glob) => `${globBase(glob)}/`));
}

export function getDerivedAssetObservationIgnoredDirs(root = process.cwd()) {
  return getDerivedAssetObservationIgnoredPrefixes(root).map((prefix) => prefix.replace(/\/$/, ""));
}

export function listDerivedAssetFamilies(root = process.cwd()) {
  return loadDerivedAssetContract(root).families.slice();
}

export function validateDerivedAssetContract(root = process.cwd()) {
  const errors: string[] = [];
  const warnings: string[] = [];
  let spec: DerivedAssetContractSpec | null = null;

  try {
    spec = loadDerivedAssetContract(root);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  return {
    ok: errors.length === 0,
    layer: "derived-asset-contract",
    errors,
    warnings,
    details: spec
      ? {
          version: spec.version,
          family_ids: spec.families.map((family) => family.family_id),
          truth_roles: Object.fromEntries(spec.families.map((family) => [family.family_id, family.truth_role])),
          observation_ignored_prefixes: getDerivedAssetObservationIgnoredPrefixes(root),
        }
      : null,
  };
}
