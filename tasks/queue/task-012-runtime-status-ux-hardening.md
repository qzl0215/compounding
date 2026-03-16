# 强化运行态状态解释与告警体验

## 目标

把运行态状态解释做成一等 UI 能力，让服务未启动、版本漂移、端口异常、状态失真等问题都能被页面和状态接口明确解释，而不是依赖人工猜测。

## 为什么

当前仓库已经补齐了本地 release/current 切换与 local runtime，但运行时问题仍是最容易让用户误判的环节。借鉴 `gstack` 对浏览器 daemon 的可观察性设计，可以让“为什么打不开”“当前跑的是哪个版本”“是否需要重启”这些问题变得一眼可见。

## 范围

- 梳理当前 release、runtime、健康检查与页面状态之间的关系
- 设计更清晰的运行态状态模型与 UI 告警表达
- 强化 `/releases` 与首页风险区的状态解释能力
- 收口运行态问题的失败语义和下一步动作建议

## 范围外

- 不扩展到远端服务器管理
- 不引入复杂监控平台或日志系统
- 不重做本地生产运行时架构

## 约束

- 继续围绕现有本地 release/current/runtime 模型演进
- 状态表达应面向非技术用户也可快速理解
- 告警必须可解释，不只是给出红字或失败标签

## 关联模块

- `apps/studio/src/modules/releases/*`
- `apps/studio/src/modules/portal/*`
- `scripts/local-runtime/*`
- `scripts/release/*`
- `docs/DEV_WORKFLOW.md`

## 分支

`codex/task-012-runtime-status-ux-hardening`

## 最近提交

`auto: branch HEAD`

## 计划

- 盘点当前运行态状态源、页面显示与错误语义之间的缺口
- 设计更清晰的状态模型和页面告警表达
- 让关键运行态问题都能给出直接的下一步动作建议

## 发布说明

本任务当前仅入列，不触发运行态变化；正式实施时再评估发布影响。

## 验收标准

- `/releases` 能清楚说明当前服务状态、版本状态与漂移状态
- 首页风险区能摘要显示当前运行态风险
- 常见运行态问题可被明确分类和解释
- 用户无需读日志也能理解多数常见故障

## 风险

- 若状态模型过细，会增加认知和实现复杂度
- 若告警语言过技术化，非工程用户仍难以理解
- 若页面与真实状态源再次分叉，会反向制造新的误导

## 状态

todo

## 更新痕迹

- 记忆：`no change: planning candidate only`
- 索引：`no change: planning candidate only`
- 路线图：`no change: current priority unchanged`
- 文档：`tasks/queue/task-012-runtime-status-ux-hardening.md`

## 复盘
