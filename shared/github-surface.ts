export type GithubSurfaceReadinessStepId =
  | "remote_origin"
  | "default_branch_upstream"
  | "active_branch_upstream"
  | "contract_identity"
  | "surface_enabled"
  | "required_checks";

export type GithubSurfaceReadinessStep = {
  id: GithubSurfaceReadinessStepId;
  label: string;
  done: boolean;
  detail: string;
  action: string | null;
};

export type GithubSurfaceReadinessInput = {
  enabled: boolean;
  provider: string;
  owner: string;
  repo: string;
  remoteName: string;
  defaultBranch: string;
  requiredChecks: string[];
  activeBranch: string;
  originUrl: string | null;
  defaultBranchUpstream: string | null;
  activeBranchUpstream: string | null;
};

export type GithubSurfaceReadinessReport = {
  enabled: boolean;
  provider: string;
  owner: string;
  repo: string;
  repoLabel: string | null;
  remoteName: string;
  defaultBranch: string;
  activeBranch: string;
  originUrl: string | null;
  defaultBranchUpstream: string | null;
  activeBranchUpstream: string | null;
  requiredChecks: string[];
  missingCount: number;
  summary: string;
  nextAction: string;
  steps: GithubSurfaceReadinessStep[];
};

function normalizeString(value: unknown, fallback = "") {
  if (typeof value === "string") return value.trim();
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
}

function buildUpstreamStep(
  id: GithubSurfaceReadinessStepId,
  label: string,
  actual: string | null,
  expected: string,
  action: string,
): GithubSurfaceReadinessStep {
  if (actual === expected) {
    return {
      id,
      label,
      done: true,
      detail: `已绑定 ${expected}。`,
      action: null,
    };
  }
  return {
    id,
    label,
    done: false,
    detail: actual ? `当前绑定 ${actual}。` : "尚未建立 upstream。",
    action,
  };
}

export function buildGithubSurfaceReadinessReport(input: GithubSurfaceReadinessInput): GithubSurfaceReadinessReport {
  const owner = normalizeString(input.owner);
  const repo = normalizeString(input.repo);
  const remoteName = normalizeString(input.remoteName, "origin");
  const defaultBranch = normalizeString(input.defaultBranch, "main");
  const activeBranch = normalizeString(input.activeBranch, defaultBranch);
  const repoLabel = owner && repo ? `${owner}/${repo}` : null;
  const requiredChecks = Array.isArray(input.requiredChecks)
    ? input.requiredChecks.map((item) => normalizeString(item)).filter(Boolean)
    : [];
  const hasRemote = Boolean(normalizeString(input.originUrl));
  const steps: GithubSurfaceReadinessStep[] = [
    {
      id: "remote_origin",
      label: "配置 origin remote",
      done: hasRemote,
      detail: hasRemote ? `当前 remote 为 ${normalizeString(input.originUrl)}。` : `仓库尚未配置 ${remoteName}。`,
      action: hasRemote ? null : `执行 git remote add ${remoteName} <github-url>`,
    },
    buildUpstreamStep(
      "default_branch_upstream",
      `推送并绑定 ${defaultBranch}`,
      normalizeString(input.defaultBranchUpstream) || null,
      `${remoteName}/${defaultBranch}`,
      `执行 git push -u ${remoteName} ${defaultBranch}`,
    ),
    activeBranch === defaultBranch
      ? {
          id: "active_branch_upstream",
          label: "为活跃 task 分支建立 upstream",
          done: true,
          detail: `当前就在 ${defaultBranch}，无需额外 task branch upstream。`,
          action: null,
        }
      : buildUpstreamStep(
          "active_branch_upstream",
          "为活跃 task 分支建立 upstream",
          normalizeString(input.activeBranchUpstream) || null,
          `${remoteName}/${activeBranch}`,
          `执行 git push -u ${remoteName} ${activeBranch}`,
        ),
    {
      id: "contract_identity",
      label: "回写 owner / repo",
      done: Boolean(repoLabel),
      detail: repoLabel ? `contract 已绑定 ${repoLabel}。` : "bootstrap/project_operator.yaml 仍缺 owner / repo。",
      action: repoLabel ? null : "在 bootstrap/project_operator.yaml 中补齐 github_surface.owner 和 github_surface.repo",
    },
    {
      id: "surface_enabled",
      label: "启用 GitHub surface",
      done: Boolean(input.enabled),
      detail: input.enabled ? "github_surface.enabled 已开启。" : "github_surface.enabled 仍为 false。",
      action: input.enabled ? null : "确认 origin 与 owner/repo 无误后，把 github_surface.enabled 改成 true",
    },
    {
      id: "required_checks",
      label: "声明 required_checks",
      done: requiredChecks.length > 0,
      detail: requiredChecks.length > 0 ? `已配置 ${requiredChecks.length} 项 required_checks。` : "required_checks 仍为空。",
      action: requiredChecks.length > 0 ? null : "把实际 PR 门禁检查名写入 github_surface.required_checks",
    },
  ];

  const pendingSteps = steps.filter((step) => !step.done);
  const nextAction = pendingSteps[0]?.action || "GitHub surface 已就绪，可以启用真实 sync / PR / checks / 远端回收。";
  const summary = pendingSteps.length
    ? `GitHub remote 仍未就绪，还差 ${pendingSteps.length} 项。`
    : "GitHub remote 已就绪，可以启用真实 sync / PR / checks / 远端回收。";

  return {
    enabled: Boolean(input.enabled),
    provider: normalizeString(input.provider, "github"),
    owner,
    repo,
    repoLabel,
    remoteName,
    defaultBranch,
    activeBranch,
    originUrl: normalizeString(input.originUrl) || null,
    defaultBranchUpstream: normalizeString(input.defaultBranchUpstream) || null,
    activeBranchUpstream: normalizeString(input.activeBranchUpstream) || null,
    requiredChecks,
    missingCount: pendingSteps.length,
    summary,
    nextAction,
    steps,
  };
}
