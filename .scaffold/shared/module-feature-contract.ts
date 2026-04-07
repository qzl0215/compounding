import path from "node:path";

export type ModuleFeatureEntrypointKind = "route" | "page" | "cli" | "service" | "component" | "doc" | "other";

export type ModuleFeatureEntrypoint = {
  label: string;
  target: string;
  kind: ModuleFeatureEntrypointKind;
};

export type ModuleFeatureContract = {
  moduleId: string;
  path: string;
  goal: string;
  ownedSurfaces: string[];
  entrypoints: ModuleFeatureEntrypoint[];
  likelyFiles: string[];
  invariants: string[];
  recommendedChecks: string[];
  commonChanges: string[];
};

export function parseModuleFeatureContract(modulePath: string, content: string): ModuleFeatureContract {
  const moduleId = extractFirstHeading(content) ?? path.basename(path.dirname(modulePath)) ?? modulePath;

  const goal =
    paragraph(extractLevelSection(content, ["模块目标"], 2) ?? "") || `待补充：说明 ${moduleId} 的模块目标。`;
  const entrypoints = parseEntrypoints(extractLevelSection(content, ["入口与拥有面"], 2) ?? "");
  const likelyFiles = parsePathList(extractLevelSection(content, ["常改文件"], 2) ?? "");
  const invariants = parseBulletList(extractLevelSection(content, ["不变量"], 2) ?? "");
  const recommendedChecks = parseBulletList(extractLevelSection(content, ["推荐校验"], 2) ?? "");
  const commonChanges = parseBulletList(extractLevelSection(content, ["常见改动"], 2) ?? "");

  return {
    moduleId,
    path: modulePath,
    goal,
    ownedSurfaces: Array.from(
      new Set(
        entrypoints
          .filter((entry) => entry.kind === "route" || entry.kind === "page" || entry.kind === "cli")
          .map((entry) => entry.target)
      )
    ),
    entrypoints,
    likelyFiles,
    invariants,
    recommendedChecks,
    commonChanges,
  };
}

export function collectLikelyTests(contract: ModuleFeatureContract) {
  const fromFiles = contract.likelyFiles.filter((value) => isTestPath(value));
  const fromChecks = contract.recommendedChecks.flatMap(extractFileLikeTokens).filter((value) => isTestPath(value));
  return Array.from(new Set([...fromFiles, ...fromChecks]));
}

function extractFirstHeading(markdown: string) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function extractLevelSection(markdown: string, headings: string[], level: number): string | null {
  const lines = markdown.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^(#{1,6})\s+(.+)$/);
    if (!match || match[1].length !== level || !matchesHeading(match[2], headings)) {
      continue;
    }
    const buffer: string[] = [];
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const next = lines[cursor].match(/^(#{1,6})\s+(.+)$/);
      if (next && next[1].length <= level) {
        break;
      }
      buffer.push(lines[cursor]);
    }
    return buffer.join("\n").trim();
  }
  return null;
}

function matchesHeading(candidate: string, headings: string[]) {
  const normalized = normalizeHeading(candidate);
  return headings.some((heading) => normalizeHeading(heading) === normalized);
}

function normalizeHeading(value: string) {
  return value
    .replace(/`/g, "")
    .replace(/[：:]/g, "")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();
}

function paragraph(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .trim();
}

function parseBulletList(section: string) {
  return section
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.replace(/^-+\s*/, "").trim())
    .map((line) => {
      const wrapped = line.match(/^`([^`]+)`$/);
      return wrapped ? wrapped[1].trim() : line;
    })
    .filter(Boolean);
}

function parsePathList(section: string) {
  return parseBulletList(section)
    .map((line) => extractCodeSpan(line) || line)
    .map((line) => line.replace(/`/g, "").trim())
    .filter(Boolean);
}

function parseEntrypoints(section: string): ModuleFeatureEntrypoint[] {
  return parseBulletList(section).map((line) => {
    const match = line.match(/^([^：:]+)[：:]\s*(.+)$/);
    const label = match ? match[1].trim() : "入口";
    const rawTarget = match ? match[2].trim() : line;
    const target = extractCodeSpan(rawTarget) || rawTarget.replace(/`/g, "").trim();
    return {
      label,
      target,
      kind: classifyEntrypoint(label),
    };
  });
}

function classifyEntrypoint(label: string): ModuleFeatureEntrypointKind {
  const normalized = label.toLowerCase();
  if (normalized.includes("路由")) return "route";
  if (normalized.includes("页面")) return "page";
  if (normalized.includes("cli") || normalized.includes("命令")) return "cli";
  if (normalized.includes("service")) return "service";
  if (normalized.includes("组件")) return "component";
  if (normalized.includes("文档")) return "doc";
  return "other";
}

function extractCodeSpan(value: string) {
  const match = value.match(/`([^`]+)`/);
  return match ? match[1].trim() : "";
}

function extractFileLikeTokens(value: string) {
  const inline = Array.from(value.matchAll(/`([^`]+)`/g))
    .map((match) => match[1].trim())
    .flatMap((token) => token.split(/\s+/));
  const pathLike = value
    .split(/\s+/)
    .map((token) => token.replace(/[,"']/g, "").trim())
    .filter((token) => token.includes("/") && !token.startsWith("http"));
  return Array.from(new Set([...inline, ...pathLike]));
}

function isTestPath(value: string) {
  return value.includes("__tests__/") || /(^|\/)test_[^/]+\.py$/.test(value) || /\.test\.[a-z]+$/i.test(value);
}
