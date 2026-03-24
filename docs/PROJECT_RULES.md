---
title: PROJECT_RULES
update_mode: promote_only
status: active
last_reviewed_at: 2026-03-24
source_of_truth: AGENTS.md
related_docs:
  - AGENTS.md
  - docs/ARCHITECTURE.md
  - memory/project/tech-debt.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 项目规则

## 文件体量限制

- TypeScript / TSX / Python 文件软上限：250 LOC
- TypeScript / TSX / Python 文件硬上限：400 LOC
- 超过软上限时，必须在任务或技术债中写明拆分计划
- 超过硬上限时，不允许继续扩张，必须进入 task queue 或 `memory/project/tech-debt.md`

## 模块边界规则

- 每个一等模块只做一件事
- 模块必须通过明确 public API 对外暴露能力
- 禁止跨模块直接访问内部私有实现
- 巨型 `util / helper / common` 不允许继续扩张；新增逻辑必须伴随清理或明确删除计划
- `apps/studio/src/modules/*` 与 `scripts/compounding_bootstrap/*` 是当前第一批高价值模块域

## 命名治理

- 除非有极明确边界，不允许新增以下名字作为核心承载层：`utils`、`helpers`、`common`、`misc`、`temp`、`final`、`new`、`v2`
- 模块名优先使用能力名，不用历史性或阶段性名字
- 兼容层必须在名字或文档中明确写出删除条件

## 变更契约

- 新增代码必须伴随清理
- 替代旧逻辑时，必须删除旧逻辑、或在技术债中写明兼容层和删除计划
- 任何结构性改动都必须同步更新 `task`、`memory`、`code_index`
- 每个执行 task 对应一条短分支；任务状态、最近提交与是否并入 `main` 必须可追踪
- task 短编号必须显式写入文档且全局唯一；不允许靠文件名或序号推导出隐式身份
- 规则若限制主线效率，可直接更新，但必须同步回 `AGENTS.md`、相关文档和 ADR

## 发布治理

- `main` 是唯一生产主线；`dev` 只是 preview channel，不是长期 git 主分支
- task 是执行边界，release 是验收与回滚边界；默认采用“1 个主 task / 1 次发布”，允许少量辅助 task 跟随
- 新 release 必须先在后台目录完成安装、构建与 smoke check，成功后才允许切换 `current`
- 每轮可验收改动默认先生成 `dev` 预览；若已有未验收 `dev`，必须先验收或驳回上一个 `dev`
- 只有验收通过的 `dev` 才能晋升到 `main` 与本地生产
- 线上回滚以 release 切换为准，不以 `git reset` 为准
- 发布失败不得影响当前线上版本；未切换前禁止覆盖现网目录

## 验证治理

- 验证体系固定分为：
  - 静态门禁
  - 构建门禁
  - 运行时门禁
  - AI 输出门禁
- 新检查应优先归入现有层次，除非确有必要，不允许继续增加新层
- 低价值检查不得被包装成硬门禁
- 错误输出必须尽量直接告诉下一步动作，而不是只报失败

## 知识资产维护

- 高频知识资产分为 `generated`、`validated`、`manual`；维护方式以 `docs/ASSET_MAINTENANCE.md` 为准
- 新经验先进入 `memory/experience/*`，稳定后再升格到 `docs/*` 或 `AGENTS.md`
- 生成产物只做导航与承载，不放判断性内容；判断性说明留在人工主源
- prompt 资产由单一注册表供运行时代码与校验器共同读取
- `code_index/*` 由脚本生成；人工补充说明写回 `docs/ARCHITECTURE.md`、`module.md` 或 task

## 兼容层规则

- 旧 workflow 前台、旧 API、旧 docs 树不允许继续扩张；必要过渡逻辑写入 `memory/project/tech-debt.md`
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
