import type { LocalRuntimeStatus, LocalRuntimeStatusType } from "./types";

export type RuntimeStatusExplanation = {
  humanLabel: string;
  explanation: string;
  nextStep: string;
  tone: "stable" | "warning" | "danger";
};

const STATUS_MAP: Record<
  LocalRuntimeStatusType,
  { humanLabel: string; explanation: string; nextStep: string; tone: RuntimeStatusExplanation["tone"] }
> = {
  running: {
    humanLabel: "运行中",
    explanation: "服务正常，可直接进入对应页面继续验收。",
    nextStep: "无需操作。",
    tone: "stable",
  },
  stopped: {
    humanLabel: "未启动",
    explanation: "服务尚未启动，页面无法访问。",
    nextStep: "先到发布页启动对应服务；dev 预览用 preview:start，production 用 prod:start。",
    tone: "warning",
  },
  stale_pid: {
    humanLabel: "进程失效",
    explanation: "记录中的进程已失效，实际服务已不在运行。",
    nextStep: "到发布页确认后，执行 prod:stop 或 preview:stop 清理状态，再重新启动。",
    tone: "warning",
  },
  port_error: {
    humanLabel: "端口异常",
    explanation: "端口被占用、进程与端口不匹配，或状态读取失败。",
    nextStep: "到发布页查看具体原因；常见做法是先停止再启动，或确认是否有其他进程占用端口。",
    tone: "danger",
  },
  drift: {
    humanLabel: "版本漂移",
    explanation: "运行中的版本与当前应切换的版本不一致，可能刚切换过 release 但未重启。",
    nextStep: "先确认是否需要重启以加载新版本；需要时执行 prod:stop 再 prod:start。",
    tone: "warning",
  },
  unmanaged: {
    humanLabel: "未托管占用",
    explanation: "端口正被非本系统托管的进程占用。",
    nextStep: "先确认是否有手动拉起的旧服务在干扰；需要时停止占用端口的进程，再启动本系统服务。",
    tone: "danger",
  },
};

export function getRuntimeStatusExplanation(
  status: LocalRuntimeStatusType,
  label?: string,
  runtime?: LocalRuntimeStatus,
): RuntimeStatusExplanation {
  const base = STATUS_MAP[status];
  const prefix = label ? `${label}：` : "";

  if (status === "running" && runtime?.runtime_release_id) {
    return {
      ...base,
      explanation: `${prefix}当前在线，运行版本 ${runtime.runtime_release_id}。`,
      nextStep: "无需操作。",
    };
  }

  if (status === "drift" && runtime) {
    return {
      ...base,
      explanation: `${prefix}运行版本 ${runtime.runtime_release_id || "未知"} 与 current ${runtime.current_release_id || "未切换"} 不一致。`,
      nextStep: base.nextStep,
    };
  }

  if (status === "stopped" && label) {
    return {
      ...base,
      explanation: `${prefix}当前未启动。`,
      nextStep: base.nextStep,
    };
  }

  return {
    ...base,
    explanation: label ? `${prefix}${base.explanation}` : base.explanation,
    nextStep: base.nextStep,
  };
}
