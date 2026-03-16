from __future__ import annotations

from typing import Any

from .renderers_docs import evidence_boundary_block


def render_system_overview() -> str:
    return f"""# 系统总览

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

{evidence_boundary_block()}
"""


def render_current_state(resolved: dict[str, Any]) -> str:
    must_protect = "，".join(str(item) for item in resolved["must_protect"])
    return f"""# 当前状态

## 项目概览

- 项目名称：{resolved["project_name"]}
- 当前阶段：专业驾驶舱、task/Git 联动与 Markdown 直编收口
- 当前优先级：{resolved["current_priority"]}
- 成功定义：{resolved["success_definition"]}
- 必须保护：{must_protect}
- 运行边界：{resolved["runtime_boundary"]}

## 使命与愿景

- 使命：把当前仓库升级成适合 AI 长期协作、任务驱动、可持续重构与自进化的 AI-Native Repo。
- 愿景：让这个项目既像创业团队一样高效推进，又能把经验、结构和发布能力持续沉淀成复利系统。

## 核心价值观

- 规则服务于效率，不服务于扩张
- 持续抓重点，不过度优化
- 少条条框框，但井井有条

## 当前焦点

- 首页文案收口为更专业的经营驾驶舱表达，同时保持高浓度可读
- 建立 task 与 Git 的双轨联动，让状态、分支、提交和是否并入 `main` 一致可追踪
- 为知识库补齐“边阅读边编辑”的最小闭环，支持 Markdown 直接维护
- 保持 task / memory / code_index / roadmap 的回写闭环，不引入新的平行体系

## 关键冻结项

- 不恢复旧 workflow 前台和重型多步骤表单
- 不把 task 演化成审批流或重型工单系统
- 不新增平行读模型或后台数据库

## 下一检查点

- `pnpm build`
- `pnpm test`
- `python3 scripts/init_project_compounding.py audit --config bootstrap/project_brief.yaml --target .`
- `node --experimental-strip-types scripts/ai/validate-change-trace.ts`
- `node --experimental-strip-types scripts/ai/validate-task-git-link.ts`

{evidence_boundary_block()}
"""


def render_tech_debt() -> str:
    return f"""# 技术债

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

{evidence_boundary_block()}
"""


def render_roadmap(resolved: dict[str, Any]) -> str:
    return f"""# 路线图

## 当前阶段

专业驾驶舱、task/Git 联动与 Markdown 直编收口

## 下个里程碑

首页成为更专业的一页经营驾驶舱，同时建立 task/Git 联动和 Markdown 直编能力，让执行、维护与发布状态收口到同一链路。

## 里程碑成功标准

- 首页文案专业、信息高浓度，且保持无右侧导航的一页阅读顺序
- `/tasks` 支持表格化任务管理，并展示 task/Git 联动状态
- `/knowledge-base` 支持 Markdown 边阅读边编辑与实时预览
- `roadmap / operating-blueprint / task / memory / index` 边界继续清晰
- task 模板与校验脚本共同约束“一个 task 一条交付链”

## 当前优先级

{resolved["current_priority"]}

## 当前执行待办

- [ ] 首页文案收口成更专业的经营驾驶舱表达
- [ ] 建立 task / Git 状态联动与校验
- [ ] `/tasks` 切换为表格化项目管理视图
- [ ] `/knowledge-base` 支持 Markdown 阅读 / 编辑双模式
- [ ] task / memory / docs / roadmap 与当前主线保持同步

{evidence_boundary_block()}
"""


def render_operating_blueprint(resolved: dict[str, Any]) -> str:
    return f"""# 运营蓝图

## 当前里程碑

专业驾驶舱、task/Git 联动与 Markdown 直编收口

## 关键子目标

### 专业经营驾驶舱

- 发布标准：
  - 首页固定为 5 个高浓度模块，且无右侧导航
  - 模块标题与摘要表达更专业，但仍然易读
- 关联任务：
  - `tasks/queue/task-005-professional-dashboard-editing.md`

### Task / Git 联动

- 发布标准：
  - 每个 task 至少具备状态、分支、最近提交
  - `/tasks` 能展示 Git 状态与是否已并入 `main`
- 关联任务：
  - `tasks/queue/task-005-professional-dashboard-editing.md`

### Markdown 直编能力

- 发布标准：
  - 知识库支持 Markdown 阅读 / 编辑双模式
  - 保存后立即回到阅读视图并展示最新内容
- 关联任务：
  - `tasks/queue/task-005-professional-dashboard-editing.md`

### 轻量 Task PM

- 发布标准：
  - task 模板包含 `分支 / 最近提交 / 计划 / 发布说明 / 验收标准 / 复盘`
  - task 是边界，不演化成重型工单
- 关联任务：
  - `tasks/queue/task-005-professional-dashboard-editing.md`

## 当前阻塞

- 暂无结构性阻塞；当前主要风险是 task 状态、Git 运行态与文档真相不同步，后续会再次返工。

## 下一检查点

- 首页专业驾驶舱 5 模块稳定
- `/tasks` 与 `validate-task-git-link` 共同通过
- Markdown 编辑链在本机/内网访问下可用

{evidence_boundary_block()}
"""
