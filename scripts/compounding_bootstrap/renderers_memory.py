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
- 当前阶段：中文友好文档、轻量任务清单与粘性导航收口
- 当前优先级：{resolved["current_priority"]}
- 成功定义：{resolved["success_definition"]}
- 必须保护：{must_protect}
- 运行边界：{resolved["runtime_boundary"]}

## 当前焦点

- live 文档主标题改成中文友好写法
- 首页、任务页、文档页、发布页统一右侧粘性导航
- task 升级成轻量项目管理清单，并补上更新痕迹
- 让 task / memory / code_index / roadmap 形成最小闭环

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
    return f"""# roadmap

## 当前阶段

中文友好文档、轻量任务清单与全站粘性导航收口

## 当前优先级

{resolved["current_priority"]}

## 验收阶梯

1. live 文档主标题中文友好
2. `/`、`/tasks`、`/knowledge-base`、`/releases` 都有粘性右侧导航
3. task 模板带更新痕迹，且 `/tasks` 可按状态查看
4. task / memory / code_index / roadmap 的更新闭环可校验
5. 不引入更重的 lane/PR/worktree 制度

## 当前执行待办

- [x] 把所有 live 文档的主标题和一级/二级段落标题改成中文友好写法
- [x] 首页、任务页、文档页、发布页统一使用右侧粘性导航
- [x] 新增 `/tasks` 页面，按 `todo / doing / blocked / done` 管理任务
- [x] task 模板补齐“更新痕迹”
- [x] 接入 `validate-change-trace` 自动校验
- [x] 吸收参考项目中的轻量任务闭环，但不搬重型并行制度

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
