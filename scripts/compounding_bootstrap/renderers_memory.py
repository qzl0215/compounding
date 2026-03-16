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
- 当前阶段：知识库富文本直编与两步 AI 文档重构收口
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

- 知识库默认在阅读界面中直接编辑正文，而不是切到原始源码编辑器
- 为带 frontmatter 或 managed block 的文档保留高级模式，避免日常编辑误触系统元数据
- 把 AI 文档重构收口为“先提关键问题，再重构正文”的两步流程
- 让 prompt 文档具备预览、保存生效与上一版本回退能力，保证后续输出稳定

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

知识库富文本直编与两步 AI 文档重构收口

## 下个里程碑

知识库进入长期可维护状态：默认在富文本阅读界面内直接编辑正文，并支持基于项目背景的两步 AI 文档重构，让人和 AI 都能更高质量地维护 Markdown 真相源。

## 里程碑成功标准

- `/knowledge-base` 默认在原阅读界面内直接编辑正文，而不是源码加预览双栏
- 带托管区块的文档在默认模式下只回写正文，高级模式下才允许编辑完整 Markdown
- AI 先提出最关键补充问题，再基于用户补充重构正文
- prompt 文档可预览、保存生效并回退到上一版本
- `roadmap / operating-blueprint / task / memory / index` 的边界继续清晰

## 当前优先级

{resolved["current_priority"]}

## 当前执行待办

- [x] 知识库默认进入正文富文本直编，而不是原始源码编辑
- [x] 保留高级模式，用于全文 Markdown / frontmatter / managed block 编辑
- [x] 接入“两步 AI 重构”链路：先提问题，再重构正文
- [x] 新增 prompt 文档预览、保存生效与上一版本回退
- [x] task / memory / docs / roadmap 与当前主线保持同步

{evidence_boundary_block()}
"""


def render_operating_blueprint(resolved: dict[str, Any]) -> str:
    return f"""# 运营蓝图

## 当前里程碑

知识库富文本直编与两步 AI 文档重构收口

## 关键子目标

### 正文富文本直编

- 发布标准：
  - 文档默认在原阅读界面内直接编辑正文
  - 标题、段落、列表、引用、代码块、表格单元格都可直接修改
- 关联任务：
  - `tasks/queue/task-006-rich-doc-edit-and-ai-rewrite.md`

### 正文与系统元数据分层

- 发布标准：
  - 默认编辑模式不暴露 frontmatter 与 managed block
  - 高级模式才允许编辑完整 Markdown 原文
- 关联任务：
  - `tasks/queue/task-006-rich-doc-edit-and-ai-rewrite.md`

### 两步 AI 文档重构

- 发布标准：
  - 第一步只提出关键补充问题，不直接改文
  - 第二步基于用户补充重构正文，并给出结构摘要与缺失提示
- 关联任务：
  - `tasks/queue/task-006-rich-doc-edit-and-ai-rewrite.md`

### Prompt 资产治理

- 发布标准：
  - prompt 文档可在 UI 中预览与编辑
  - prompt 变更后可保存生效，并支持回退到上一版本
- 关联任务：
  - `tasks/queue/task-006-rich-doc-edit-and-ai-rewrite.md`

## 当前阻塞

- 暂无结构性阻塞；当前主要风险是复杂 Markdown 结构在正文模式下可能丢失格式细节，需要继续用测试守住序列化边界。

## 下一检查点

- 正文直编、保存与高级模式切换在知识库页面可用
- AI 补充问题与正文重构两步链路可用
- prompt 预览、保存与回退链路可用

{evidence_boundary_block()}
"""
