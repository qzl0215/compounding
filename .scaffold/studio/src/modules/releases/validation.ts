export type ValidationLayer = {
  id: "static" | "build" | "runtime" | "ai-output";
  title: string;
  summary: string;
  commands: string[];
  runWhen: string;
  failureMeaning: string;
  nextStep: string;
};

export const VALIDATION_LAYERS: ValidationLayer[] = [
  {
    id: "static",
    title: "静态门禁",
    summary: "先拦住没有必要进入构建阶段的问题，重点看规范、task 绑定、代码健康和 lint。",
    commands: ["pnpm validate:static", "pnpm validate:static:strict"],
    runWhen: "每次代码改动后，进入 dev 预览前必跑。",
    failureMeaning: "说明当前改动还不满足最基本的结构、命名、task 回写或代码风格要求。",
    nextStep: "默认先修 task / lint / 轻量扫描类问题；若要继续收技术债，再补跑 strict 版本。",
  },
  {
    id: "build",
    title: "构建门禁",
    summary: "确认测试、构建和 bootstrap 审计通过，避免把明显不稳的版本送进预览或生产。",
    commands: ["pnpm validate:build"],
    runWhen: "静态门禁通过后，生成 dev 预览前必跑。",
    failureMeaning: "说明代码虽能通过静态检查，但在测试、构建或 scaffold/audit 层仍不稳定。",
    nextStep: "先修测试、构建或 audit 失败，再重新跑构建门禁。",
  },
  {
    id: "runtime",
    title: "运行时门禁",
    summary: "确认 preview 或 production 实际在线、关键页面可访问、版本与运行态不漂移。",
    commands: ["pnpm preview:check", "pnpm prod:check"],
    runWhen: "生成 dev 预览后、production 切换后必须跑。",
    failureMeaning: "说明版本可能已准备完成，但服务没有真正健康在线，或当前运行态与 release 语义不一致。",
    nextStep: "先看 `/releases`、runtime status 和端口状态，再决定是重启、重切换还是回滚。",
  },
  {
    id: "ai-output",
    title: "AI 输出门禁",
    summary: "确认 AI 文档重构与 prompt 资产可用，避免 AI 输出层 silently drift 或配置半残。",
    commands: ["pnpm validate:ai-output"],
    runWhen: "修改 prompt、AI 重构链路、AI 文档接口或准备发布这些改动时必跑。",
    failureMeaning: "说明 prompt 资产、AI 路由支撑文件或 provider 配置存在缺口，AI 输出结果不值得信任。",
    nextStep: "先补 prompt / 路由 / provider 资产，再进入发布链路。",
  },
];

export const RELEASE_VALIDATION_ORDER = VALIDATION_LAYERS.map((layer) => layer.id);
