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
- 当前阶段：公司介绍式首页与组织架构收口
- 当前优先级：{resolved["current_priority"]}
- 成功定义：{resolved["success_definition"]}
- 必须保护：{must_protect}
- 运行边界：{resolved["runtime_boundary"]}

## 当前焦点

- 首页收口成“公司介绍 + 今日作战板”，让新人看一眼就知道项目是谁、现在打什么仗、谁负责什么
- 新增 `docs/ORG_MODEL.md`，把 7 个角色卡片和组织原则固定成唯一真相源
- 首页和文档页的语义入口改成组织语言，而不是目录语言
- 保持 task / memory / code_index / roadmap 的回写闭环，不引入新的平行体系

## 下一检查点

- `pnpm build`
- `pnpm test`
- `python3 scripts/init_project_compounding.py audit --config bootstrap/project_brief.yaml --target .`
- `node --experimental-strip-types scripts/ai/validate-change-trace.ts`

{evidence_boundary_block()}
"""


def render_tech_debt() -> str:
    return f"""# 技术债

## 当前技术债

1. 当前发布模型是单机 `systemd + reverse proxy + symlink cutover` 骨架；还没有多进程零停机或多机容灾能力
2. 本机/内网发布管理页已可读写 release registry，但尚未经过真实生产反向代理环境的 live 验证
3. proposal engine 已支持模型优先生成，但默认仍依赖 Ark/Volcano/OpenAI 环境变量；未配置时会回退到 deterministic rewrite
4. `scripts/ai/build-context.ts`、`generate-module-index.ts` 与 `validate-change-trace.ts` 仍是轻量版本，后续可继续提高相关性判断与 trace 精度
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

公司介绍式首页与组织架构收口

## 当前优先级

{resolved["current_priority"]}

## 验收阶梯

1. 首页能像公司介绍一样，一屏说明项目是谁、现在打什么仗、谁负责什么、下一步先看什么
2. `docs/ORG_MODEL.md` 成为 7 个角色卡片的唯一真相源
3. 首页和文档页的语义入口切到组织语言
4. task / memory / code_index / roadmap 的既有闭环不被破坏
5. 不引入更重的 lane/PR/worktree 制度，也不新增平行 read model

## 当前执行待办

- [x] 将当前主线切换到“公司介绍式首页与组织架构收口”
- [x] 新增 `docs/ORG_MODEL.md` 并定义 7 个核心角色
- [x] 首页改为“我们是谁 / 今天在打什么仗 / 组织一览 / 核心系统 / 新人入职路径 / 当前风险”
- [x] 文档页语义入口改成组织语言
- [x] 吸收轻量任务闭环与经验写法，但不搬重型并行制度

{evidence_boundary_block()}
"""


def render_experience_readme() -> str:
    return """# 经验记录说明

这里记录尚未升格为长期规则的经验。默认先记忆，再验证，再决定是否升格。

## 记录格式

- 背景
- 决策
- 为什么
- 影响
- 复用

## 升格候选

- 重复出现 2 次以上且无明显例外的经验，才能候选升格
- 若现有规则已直接阻碍 roadmap 主线效率，可直接改规，但必须同步写 ADR
"""


def render_experience_entry(title: str, context: str, decision: str, why: str, impact: str, reuse: str) -> str:
    return f"""# {title}

## 背景

{context}

## 决策

{decision}

## 为什么

{why}

## 影响

{impact}

## 复用

{reuse}
"""


def render_adr(title: str, context: str, decision: str, consequences: str) -> str:
    return f"""# {title}

## 背景

{context}

## 决策

{decision}

## 影响结果

{consequences}
"""
