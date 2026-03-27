export type GitChangedFilesParseMode = "status" | "name_only";

type ParseGitChangedFilesOptions = {
  mode: GitChangedFilesParseMode;
  ignoredPrefixes?: string[];
};

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

export function normalizeGitChangedFile(value: string) {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  return normalized.includes(" -> ") ? normalized.split(" -> ").at(-1)?.trim() ?? "" : normalized;
}

export function parseGitChangedFiles(rawOutput: string, options: ParseGitChangedFilesOptions) {
  const ignoredPrefixes = Array.isArray(options.ignoredPrefixes) ? options.ignoredPrefixes.filter(Boolean) : [];
  const mode = options.mode === "name_only" ? "name_only" : "status";

  const files = String(rawOutput || "")
    .split("\n")
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map((line) => {
      if (mode === "status") {
        const match = line.match(/^.. (.+)$/);
        if (!match) return "";
        return normalizeGitChangedFile(match[1]);
      }
      return normalizeGitChangedFile(line);
    })
    .filter(Boolean)
    .filter((file) => !ignoredPrefixes.some((prefix) => file.startsWith(prefix)));

  return unique(files);
}
