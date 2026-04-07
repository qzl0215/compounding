# 接入超能技能库并映射仓库协作协议

## 任务摘要

- 任务 ID：`task-087`
- 短编号：`t-087`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  接入超能技能库并映射仓库协作协议
- 为什么现在：
  把 `obra/superpowers` 安装到 Codex，并把其流程技能映射到本仓 `task / preflight / review / release` 协议，同时补齐本机 overlay、worktree 约定与 doctor 扩展，避免技能层与项目主源长期冲突。
- 承接边界：
  只安装本机 Superpowers 技能、补仓库共享规则映射、增加 repo-specific overlay、固定 `.worktrees/` 约定并扩展 doctor 命令与最小测试；不把技能仓 vendoring 进本仓，不改 Studio 业务逻辑，不把个人本机环境变成默认硬门禁。
- 完成定义：
  `~/.codex/superpowers` 与 `~/.agents/skills/superpowers` 已按官方方式安装；`~/.codex/skills/compounding-operating-profile/SKILL.md` 已定义本仓 overlay；`~/.codex/config.toml` 默认推理强度已从 `xhigh` 调整到 `high`；`pnpm ai:doctor:superpowers` 能检查 clone、upstream SHA、symlink、`multi_agent`、overlay、repo 映射与 `.worktrees/` 标准；`AGENTS.md` 与 `docs/AI_OPERATING_MODEL.md` 已明确默认启用 / 条件启用 / 默认抑制规则；静态校验与新增测试通过。
- 交付轨道：`direct_merge`

## 执行合同

### 要做

- 安装 `obra/superpowers` 到本机 Codex 技能目录
- 建立 `~/.agents/skills/superpowers` 软链接并校验核心技能目录
- 新建 `~/.codex/skills/compounding-operating-profile/SKILL.md`
- 把 `~/.codex/config.toml` 默认推理强度降到 `high`
- 新增 `scripts/ai/doctor-superpowers.ts`
- 把 `.worktrees/` 固定为项目标准 worktree 目录并加入 ignore
- 在 `package.json` 增加 `pnpm ai:doctor:superpowers`
- 更新 `AGENTS.md` 与 `docs/AI_OPERATING_MODEL.md` 的技能映射规则
- 补最小 CLI 测试与必要项目状态回写

### 不做

- 不把 Superpowers 代码复制到仓库
- 不改 `CLAUDE.md` 与 `OPENCODE.md`
- 不改 `apps/studio` 页面、运行时拓扑或 release 流
- 不把本机安装状态接入 `preflight` 或 `validate:static` 的默认硬阻断
- 不扩到 Claude/OpenCode 的专属实现层
- 不直接 patch 上游 `~/.codex/superpowers` 技能内容

### 约束

- 仓库规则优先级高于 Superpowers 默认流程
- `planning / execution / review / release` 仍只认 `kernel/task-state-machine.yaml`
- 只允许通过显式 doctor 命令校验个人本机安装，不制造新全局门禁
- task 标题、分支、preflight、handoff、review、release 继续服从现有仓库协议
- Superpowers 相关仓库特化逻辑只能落在 overlay、doctor 与仓库主源，不能把 `docs/superpowers/*` 变成本仓第二套长期主源

### 关键风险

- 若直接全量套用 Superpowers 默认流程，可能绕过或稀释本仓 task 状态机
- 若把本机技能检查接进默认门禁，会把个人环境差异放大成团队阻断
- 若共享主源写得过长，容易和现有跨工具薄入口重复
- 外部技能仓目录结构若变化，doctor 命令需要给出明确失败提示

### 测试策略

- 为什么测：
  这轮同时涉及本机技能安装、共享规则映射和新 CLI 校验入口，最容易回退的是技能发现路径、优先级约束和脚本提示语。
- 测什么：
  - `pnpm ai:doctor:superpowers` 对 clone、symlink、`multi_agent`、核心技能目录的检查
  - `pnpm ai:doctor:superpowers` 对 upstream SHA、overlay、repo 映射与 `.worktrees/` 标准的检查
  - doctor 命令的成功与失败输出
  - `pnpm validate:static` 对文档与脚本接入的兼容性
- 不测什么：
  - 不做 Superpowers 内部技能逻辑测试
  - 不做 Codex 重启后的自动化会话 smoke
  - 不做 `apps/studio` UI 回归
- 当前最小集理由：
  先锁住本仓可控边界里的安装映射、脚本输出和主源优先级，不把验证面扩大到外部工具行为本身。

## 交付结果

- 状态：doing
- 体验验收结果：
  `pnpm ai:doctor:superpowers -- --json` 已确认本机 clone、upstream SHA `eafe962b18f6c5dc70fb7c8cc7e83e61f4cdde06`、symlink、`multi_agent`、7 个核心技能目录、overlay、repo 映射与 `.worktrees/` 标准全部齐全；`python3 -m unittest tests.test_ai_assets_cli.AiAssetsCliTests.test_doctor_superpowers_reports_success_with_override_homes tests.test_ai_assets_cli.AiAssetsCliTests.test_doctor_superpowers_fails_when_required_skill_is_missing tests.test_ai_assets_cli.AiAssetsCliTests.test_doctor_superpowers_requires_overlay_and_worktree_standard`、`python3 -m unittest tests.test_coord_cli.CoordCliTests.test_coord_task_start_uses_unified_preflight_entry` 与 `pnpm validate:static` 已通过。
- 交付结果：
  已把 `obra/superpowers` 安装到 `~/.codex/superpowers`，并把 `~/.agents/skills/superpowers` 指向其 `skills/` 目录；本机新增了 `~/.codex/skills/compounding-operating-profile/SKILL.md`，把本仓主链翻译成 Superpowers overlay；`~/.codex/config.toml` 默认推理强度已降到 `high`；仓库把 `.worktrees/` 固定为标准隔离目录并加入 ignore；`scripts/ai/doctor-superpowers.ts` 已扩展为同时检查 upstream SHA、overlay、repo 映射和 `.worktrees/` 标准；`AGENTS.md` 和 `docs/AI_OPERATING_MODEL.md` 也已明确默认启用 / 条件启用 / 默认抑制规则，确保 Superpowers 只作为增强层而不反向接管本仓协议；为恢复标准 task 流，顺手修正了 `scripts/coord/lib/preflight-gate.ts` 里的未定义变量回归。
- 复盘：
  这类工具层接入最容易踩的坑不是安装本身，而是让外部流程反向接管仓库协议，或者把本机特化直接 patch 到上游技能仓里。把技能层定位成增强层、把 repo-specific 差异收敛到 overlay + doctor、并固定 `.worktrees/` 与 `high` 默认推理强度，才能把长期吞吐和可升级性同时保住。

## 分支

`codex/task-087-superpowers-protocol`

## 关联模块

- `AGENTS.md`
- `docs/AI_OPERATING_MODEL.md`
- `.gitignore`
- `docs/ASSET_MAINTENANCE.md`
- `docs/OPERATOR_RUNBOOK.md`
- `memory/project/current-state.md`
- `memory/project/operating-blueprint.md`
- `package.json`
- `~/.codex/config.toml`
- `~/.codex/skills/compounding-operating-profile/SKILL.md`
- `scripts/ai/`
- `scripts/coord/`
- `tests/`
- `tasks/queue/task-087.md`

## 更新痕迹

- 记忆：no change: 当前分支未回写 project memory，避免为同日文档制造假的 review 日期
- 索引：no change: 未更新
- 路线图：no change: 未更新
- 文档：updated AGENTS / AI_OPERATING_MODEL / ASSET_MAINTENANCE / OPERATOR_RUNBOOK
