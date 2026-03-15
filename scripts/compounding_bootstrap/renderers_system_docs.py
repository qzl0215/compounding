from __future__ import annotations

from typing import Any

from .renderers_base_docs import bullet_list, evidence_boundary_block


def render_architecture(resolved: dict[str, Any]) -> str:
    studio_modules = resolved["repo_scan"].get("studio_modules") or ["portal", "docs", "git-health"]
    bootstrap_modules = resolved["repo_scan"].get("bootstrap_modules") or [
        "defaults",
        "config_resolution",
        "managed_blocks",
        "document_renderers",
        "scaffold",
        "audit",
        "proposal_engine",
        "engine",
    ]
    return f"""# 架构

## 仓库结构

- `apps/studio/`: 只读文档门户
- `scripts/compounding_bootstrap/`: scaffold / audit / proposal 引擎
- `docs/`: 规则层、架构层、流程层、AI operating model、重构计划
- `memory/`: 架构记忆、项目状态、经验、ADR
- `code_index/`: 模块索引、依赖图、函数索引
- `tasks/`: 模板、队列、归档

## 核心模块域

### Studio 模块

{bullet_list([f"`apps/studio/src/modules/{name}`" for name in studio_modules])}

### Bootstrap 引擎模块

{bullet_list([f"`scripts/compounding_bootstrap/{name}.py`" for name in bootstrap_modules])}

## 依赖方向

1. `AGENTS.md` 提供高频入口
2. `docs/*` 提供长期规则、架构和流程
3. `tasks/*` 给出当前变更边界
4. `code_index/*` 提供上下文导航
5. 代码模块只依赖必要的邻近模块和共享基础层

## 生产发布运行时

- 运行根目录由 `AI_OS_RELEASE_ROOT` 决定；默认是仓库同级的 `.compounding-runtime`
- 目录约定固定为：
  - `releases/<release-id>/`
  - `current`
  - `shared/`
  - `registry.json`
- 新版本先在 `releases/<release-id>` 完成构建与 smoke check，再原子切换 `current`
- 本机或内网管理页通过 `apps/studio/src/modules/releases` 读取 registry，并触发 deploy / rollback

## 组织职责映射

- 组织角色的唯一真相源在 `docs/ORG_MODEL.md`
- `总经办 / Foreman Office` 负责主线、优先级、发布裁决和组织设计
- `PMO / 产品 / 设计` 负责需求边界、交付节奏、方案与体验质量
- `架构 / 工程` 负责模块边界、实现、重构和发布准备
- `质量与度量` 负责验收、回归、量化评估和 ROI 判断

## 当前重构批次

- 删除旧 workflow 前台和对应 API
- 把 Studio 收口为 `portal / docs / git-health`
- 把 bootstrap 引擎拆成可维护的 Python 微模块
- 补齐 `memory / tasks / code_index / scripts/ai` 骨架

## 禁止调用方式

- 禁止从 UI 组件跨层读取任意文件系统状态而不经过模块仓储层
- 禁止在 bootstrap 引擎里继续堆单一巨型 `engine.py`
- 禁止把临时上下文直接塞回 `AGENTS.md`

{evidence_boundary_block()}
"""

def render_dev_workflow() -> str:
    return f"""# 开发工作流

## 主发布规则

- `main` 是唯一生产主线
- 本地短分支仍可用于临时开发，但发布动作只认 `main`
- 不再使用 `dev` 作为发布缓冲层

## 标准流程

1. 先读 `AGENTS.md`
2. 再读 `docs/PROJECT_RULES.md`、`docs/ARCHITECTURE.md`
3. 再读当前任务文件、相关 `module.md`、`code_index/*`
4. 运行 `python3 scripts/pre_mutation_check.py`
5. 完成最小可验证改动
6. 更新 `task / memory / code_index / docs`
7. 完成 review，并让改动进入 `main`
8. 运行 `node --experimental-strip-types scripts/release/prepare-release.ts --ref main`
9. 构建与 smoke 通过后，再运行 `node --experimental-strip-types scripts/release/switch-release.ts --release <release-id>`

## 汇报契约

- 默认回复结构：
  - 已完成清单
  - 证据与当前结论适用边界
  - 风险与待决策
  - 下一步
- 所有关键报告必须显式区分：
  - 本地离线证据
  - 服务器真实证据
  - 当前结论适用边界

## 任务规则

- 每个结构性改动必须绑定 `tasks/queue/*`
- 默认先更新 task，再改代码；改完后补齐更新痕迹和必要回写
- 任务至少包含 目标 / 为什么 / 范围 / 范围外 / 约束 / 关联模块 / 验收标准 / 风险 / 状态 / 更新痕迹
- 修改结束后要同步更新任务状态和验收结果
- `更新痕迹` 必须明确写出：
  - 记忆
  - 索引
  - 路线图
  - 文档
  若某项无变化，写 `no change: <reason>`

## 发布规则

- 新版本必须先在后台 release 目录完成准备，再切换 `current`
- 切换失败前不得影响当前线上版本
- 回滚通过 `scripts/release/rollback-release.ts` 或本机/内网发布管理页执行
- 发布和回滚动作必须串行执行，release lock 未释放前不得触发第二个动作
- 对于 Next.js 门户，服务重载采用 `systemctl restart` 或等价最小重启

{evidence_boundary_block()}
"""


def render_ai_operating_model() -> str:
    return f"""# AI 工作模型

## 标准阅读顺序

1. `AGENTS.md`
2. `docs/PROJECT_RULES.md`
3. `docs/ARCHITECTURE.md`
4. 当前任务文件
5. 相关 `module.md`
6. `code_index/*`
7. 必要代码
8. 动手前 `python3 scripts/pre_mutation_check.py`

## 任务驱动开发

- AI 默认围绕 `tasks/queue/*` 工作
- 若任务不存在，先用 `scripts/ai/create-task.ts` 生成
- 任务是 scope 和验收边界，不是可有可无的备注
- 任务的目标是让团队高效协作，而不是制造更多流程负担

## 上下文系统

- `code_index/module-index.md` 给模块入口
- `code_index/dependency-map.md` 给依赖方向
- `code_index/function-index.json` 给粗粒度函数索引
- `scripts/ai/build-context.ts` 负责把规则、架构、任务、模块和记忆压缩成最小上下文包

## 记忆系统

- 新经验先进入 `memory/experience/*`
- 已裁决事项进入 `memory/decisions/ADR-*.md`
- 当前项目状态和 roadmap 在 `memory/project/*`
- 经验重复验证后才允许升格到 `docs/*` 或 `AGENTS.md`
- 角色职责以 `docs/ORG_MODEL.md` 为准，避免在多个文档里平行复制组织设计

## 自进化闭环

扫描问题
→ 生成 task
→ 修改模块
→ 更新 memory
→ 更新 code_index
→ 进入 `main`
→ 生成 release
→ 切换或回滚
→ 在下一轮扫描中验证是否真正收敛

## 生产直发

- 生产发布以 `main` 为唯一主线
- 版本构建在后台 release 目录完成
- 线上切换只在构建和 smoke 成功后发生
- 若新版异常，优先选择：
  - 继续在 `main` 上修出下一次 release
  - 或直接回滚到上一个健康 release

## 工作原则

- 优先减少理解成本
- 优先减少重复逻辑
- 优先减少隐式依赖
- 不做大面积业务重写
- 创业团队文化优先：持续抓重点，不过度优化，少条条框框，但井井有条

{evidence_boundary_block()}
"""
