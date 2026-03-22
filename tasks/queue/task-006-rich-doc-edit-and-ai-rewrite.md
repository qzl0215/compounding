# 任务 task-006-rich-doc-edit-and-ai-rewrite

## 短编号

t-006

## 目标

把知识库升级成“富文本直编 + 两步 AI 重构”的长期可用编辑系统。

## 为什么

当前编辑体验仍然是源码编辑器加预览器，不符合在高质量阅读界面中直接修改内容的目标；同时 AI 能力虽然已具备 Ark/Volcano 兼容调用基础，但还未接入文档编辑链路，也无法先提问再重构。

## 范围

- `/knowledge-base` 改成默认正文富文本直编
- 保留高级模式，用于全文 Markdown / frontmatter / managed block 编辑
- 新增两步 AI 重构流程
- 新增 prompt 文档、预览、保存与上一版本回退
- 更新当前主线、任务、索引与相关文档

## 范围外

- AI 自动落盘
- 协同编辑
- 文档级删除按钮
- WYSIWYG 第三方重型编辑器

## 约束

- 默认只编辑正文层，不暴露 frontmatter 与托管标记
- 所有 live 文档仍以 Markdown 为唯一真相源
- AI 调用必须走 `.env` 中的 Ark / Volcano DeepSeek 配置
- scaffold-managed 文档在正文模式下只回写 canonical 正文区

## 关联模块

- `apps/studio/src/modules/docs`
- `apps/studio/src/modules/portal`
- `apps/studio/src/app/api/docs/*`
- `scripts/ai/*`
- `docs/prompts/*`

## 当前模式

发布复盘

## 分支

`codex/task-006-rich-doc-edit-and-ai-rewrite`

## 最近提交

`bd37dec`

## 交付收益

让知识库正文直编、AI 两步重构和 prompt 治理形成长期可维护的文档工作流。

## 交付风险

文档链路一旦混入新的平行编辑模式或隐式真相源，维护成本会快速回升。

## 一句复盘

文档体验要围绕 Markdown 主源增强，而不是绕开 Markdown 再造一套系统。

## 计划

- 先建立正文编辑模型与保存边界
- 再接 AI 两步重构服务与 UI 面板
- 再补 prompt 文档管理、测试和主文档回写

## 发布说明

这轮会改动知识库核心编辑链路，进入 `main` 前必须通过 lint / test / build / audit，并验证本地页面可正常打开、编辑、保存和 AI 预览。

## 验收标准

- 文档默认在阅读界面内直接编辑正文
- 高级模式可编辑全文 Markdown
- AI 先提关键问题，再基于补充重构内容
- prompt 文档可预览、保存生效并回退到上一个版本
- 现有 Markdown 真相源与 managed block 边界不被破坏

## 风险

- Markdown 结构过于复杂时，正文直编的序列化可能丢失格式细节
- prompt 变更若无版本回退，会导致 AI 输出不稳定
- Ark 模型输出若不严格遵守结构，前端展示与应用逻辑会失稳

## 状态

done

## 更新痕迹

- 记忆：`no change: historical task metadata alignment only`
- 索引：`no change: historical task metadata alignment only`
- 路线图：`no change: current priority unchanged`
- 文档：`tasks/queue/task-006-rich-doc-edit-and-ai-rewrite.md`

## 复盘

- 默认正文直编、完整 Markdown 高级模式、两步 AI 重构与 prompt 版本回退已在同一知识库链路中收口，后续迭代可围绕编辑质量和提示词质量继续减法优化。
- 主线合并后，任务页测试已同步改成读取真实最近提交值，避免表格展示与测试基线继续依赖 `auto:` 占位写法。
