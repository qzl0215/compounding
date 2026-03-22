from __future__ import annotations

from typing import Any

from .renderers_base_docs import bullet_list


def render_system_overview() -> str:
    return """# 系统总览

## 系统目标

- 让仓库天然适合 AI 长期协作
- 让多 agent 可以围绕 task / module / memory 并行工作
- 让结构、规则和经验能持续收敛，而不是持续膨胀

## 核心模块

- `AGENTS.md`
- `docs/*`
- `memory/*`
- `tasks/*`
- `code_index/*`
- `apps/studio/src/modules/*`
- `scripts/compounding_bootstrap/*`

## 数据流

任务 → 最小上下文 → 模块改动 → 记忆回写 → 索引更新 → review → main → release 准备 → `current` 切换 / 回滚 → 新一轮扫描

## 关键边界

- `AGENTS.md` 只做高频执行入口
- `docs/*` 不与 `AGENTS.md` 竞争主源
- `memory/*` 先记忆，后升格
- `code_index/*` 只做导航，不替代真实代码
- 生产 runtime 用 `releases/<id> + current + shared + registry.json` 管理，而不是原地覆盖

## 模块职责

- Studio 负责只读展示
- Bootstrap 引擎负责 scaffold / audit / proposal / apply
- AI 脚本负责扫描、建索引、建上下文、建任务

## 禁止的调用方式

- 禁止跨模块直接依赖私有实现
- 禁止继续堆巨型 `engine.py`
- 禁止未过 preflight 就进入改动
"""


def render_current_state(resolved: dict[str, Any]) -> str:
    must_protect = [str(item) for item in resolved["must_protect"]]
    return f"""# 当前状态

## 项目概览

- 项目名称：{resolved["project_name"]}
- 战略真相请看 `memory/project/roadmap.md`
- 这里仅记录当前运营快照、冻结项和运行边界

## 使命与愿景

- 使命：把当前仓库升级成适合 AI 长期协作、任务驱动、可持续重构与自进化的 AI-Native Repo。
- 愿景：让这个项目既像创业团队一样高效推进，又能把经验、结构和发布能力持续沉淀成复利系统。

## 核心价值观

- 规则服务于效率，不服务于扩张
- 持续抓重点，不过度优化
- 少条条框框，但井井有条

## 本地入口

- 本地生产默认端口：`3010`
- dev 预览默认端口：`3011`
- `main` 已更新不等于本地生产自动在线；需要手动拉起本地常驻进程

## 运行边界

- {resolved["runtime_boundary"]}

## 当前焦点

- 本地 production 默认在 `3010` 提供服务；主线更新后仍需人工确认常驻进程与 `pnpm prod:check`。
- 当前运营焦点跟随 `roadmap` 的当前优先级：{resolved["current_priority"]}
- 当前阶段默认优先收口单一真相、最小闭环与高 ROI 结构改动，不扩新平台。

## 当前推荐校验顺序

- 静态门禁：`pnpm validate:static`
- 构建门禁：`pnpm validate:build`
- 运行时门禁：
  - `pnpm preview:check`
  - `pnpm prod:check`
- AI 输出门禁：`pnpm validate:ai-output`（仅在 prompt / AI 重构链路变动时进入）
- 多 Agent 协调：`pnpm coord:check:pre-task`（在 task 变更前执行）

## 关键冻结项

{bullet_list(must_protect + ['不以一次大改替代批次推进与逐步验收'])}

## 下一检查点

- `pnpm validate:static`
- `pnpm validate:build`
- `pnpm preview:check`
- `pnpm prod:check`
- `pnpm coord:check:pre-task`
"""


def render_tech_debt() -> str:
    return """# 技术债

## 当前技术债

1. 当前发布模型是单机 `systemd + reverse proxy + symlink cutover` 骨架；还没有多进程零停机或多机容灾能力
2. 本机/内网发布管理页已可读写 release registry，但尚未经过真实生产反向代理环境的 live 验证
3. proposal engine 已支持模型优先生成，但默认仍依赖 Ark/Volcano/OpenAI 环境变量；未配置时会回退到 deterministic rewrite
4. `scripts/ai/build-context.ts`、`generate-module-index.ts`、`validate-change-trace.ts` 与 `validate-task-git-link.ts` 仍是轻量版本，后续可继续提高相关性判断与 trace 精度
5. 当前没有 remote，`main` 直发生产只在本地仓库语义上成立；远端分支和 release tag 推送仍需后续接通

## 删除计划

- 任何仍然保留的 legacy 文本或兼容路径，都要在下一轮重构中删除或归档
- 任何新增临时层都必须写清删除触发条件
- 若后续验证 `systemctl restart` 对当前流量影响仍偏大，再评估更细粒度的 reload / socket activation 策略
"""


def render_roadmap(resolved: dict[str, Any]) -> str:
    return f"""# 路线图

## 当前阶段

围绕当前主线持续收口结构、规则与交付闭环

## 下个里程碑

围绕当前优先级完成一轮可发布、可复盘、可继续复利的主线交付。

## 里程碑成功标准

- {resolved["success_definition"]}
- `roadmap / current-state / operating-blueprint` 的职责边界持续清晰
- 当前主线的 task / release / memory / code_index 口径一致
- 这轮推进不新增新的持久化真相源

## 当前优先级

{resolved["current_priority"]}

## 当前执行待办

- [ ] 围绕当前优先级创建或推进当前主线 task
- [ ] 保持 `roadmap / current-state / operating-blueprint` 口径一致
- [ ] 完成最小可验证改动，并同步 task / memory / docs / code_index
- [ ] 通过 release build、smoke gate 与必要的 review
"""


def render_operating_blueprint(resolved: dict[str, Any]) -> str:
    return f"""# 运营蓝图

## 当前里程碑

围绕当前优先级把主线拆成可执行、可验收、可发布的战术子目标

## 关键子目标

### 子目标 1：明确当前主线与交付边界

- 发布标准：
  - 当前主线对应的任务边界明确
  - 范围外与冻结项写清，不边做边改主线
  - 任务、路线图与发布说明使用同一口径

### 子目标 2：让改动走完整门禁链

- 发布标准：
  - 改动前过 preflight 与 `coord:check:pre-task`
  - 改动后通过静态、构建、运行态与必要的 AI 输出门禁
  - `dev → main → prod` 验收链保持可解释和可回滚

### 子目标 3：保持真相源与投影收口

- 发布标准：
  - `task / release / memory / docs / code_index` 的职责边界清晰
  - 页面只消费共享投影，不继续复制状态或再造真相
  - 经验先写 memory，稳定后再升格到 docs 或 AGENTS

### 子目标 4：控制结构性熵增

- 发布标准：
  - 不新增新的 orchestration UI、数据库或重型审批流
  - 规则只保留高频主源，不在多份文档里平行复制
  - 临时兼容层必须写清删除条件

## 当前阻塞

- 若当前主线的任务边界、发布标准或运行态条件不清晰，AI 仍会被迫回到多处猜测与重复解释。

## 下一检查点

- [ ] 当前优先级对应的 task 进入 `doing`
- [ ] 当前主线的发布标准和 review 口径明确
- [ ] preview / prod 两条链都验证通过，且回写到任务与记忆
"""
