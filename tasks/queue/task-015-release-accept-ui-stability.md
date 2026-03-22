# 修复 dev 验收发布时的页面异常与运行态漂移

## 短编号

t-015

## 目标

修复在 `dev` 预览页点击“验收通过并发布到 main”后出现的客户端异常，并消除发布完成后本地 production 运行态误判漂移的问题。

## 为什么

当前发布链已经支持 `dev -> main -> production`，但验收按钮会在预览服务关闭时触发前端异常，且 production 状态会把复用 preview 构建产物误判成版本漂移。这会直接削弱发布链的可信度。

## 范围

- 修复发布页按钮交互的错误处理与成功后的跳转策略
- 修复本地运行态对逻辑 release id 的识别
- 补最小回归测试
- 更新本任务的更新痕迹

## 范围外

- 不重做整套 release registry
- 不扩远端服务器发布
- 不调整当前主线任务优先级

## 约束

- 所有改动必须保持 `dev` 预览和 `production` 发布链可用
- 不允许通过隐藏异常来掩盖真实失败
- 修复后必须给出可直接点击的页面验收链接

## 关联模块

- `apps/studio/src/modules/releases/*`
- `apps/studio/src/app/api/releases/*`
- `scripts/local-runtime/*`
- `scripts/release/*`

## 当前模式

发布复盘

## 分支

`codex/task-015-release-accept-ui-stability`

## 最近提交

`auto: branch HEAD`

## 交付收益

让“验收通过并发布到 main”的关键 UI 流程更稳定、更可解释，降低发布链的意外中断。

## 交付风险

若验收流只修表面交互而不修 runtime 与 release 时序，问题会在下一次晋升时重现。

## 一句复盘

验收 UI 只是入口，真正需要稳定的是背后的发布状态机。

## 计划

1. 复现发布页“验收通过”异常并定位前端/运行态双重根因。
2. 修复按钮交互与本地运行态逻辑 release id 判断，并补最小回归。
3. 重新走一轮 `dev -> accept -> production` 链路并提供验收链接。

## 发布说明

本任务会影响 `/releases` 的发布交互与本地运行态状态判断。修复后需重新生成 `dev` 预览并验收通过，再切换 production。

## 验收标准

- 在 `dev` 预览页点击“验收通过并发布到 main”不再出现客户端异常
- 动作成功后页面跳转到稳定的 production 发布页
- production 运行态不再误报因为复用 preview 构建产物导致的漂移
- `pnpm test`、`pnpm lint`、`pnpm build`、`pnpm prod:check` 通过

## 风险

- release 交互修复如果只修前端而不修运行态，会留下隐性状态漂移
- 生产与预览通道共享同一套 registry，修复时必须避免破坏历史记录

## 状态

done

## 更新痕迹

- 记忆：no change: incident-level fix only
- 索引：no change: no index impact
- 路线图：memory/project/roadmap.md, memory/project/operating-blueprint.md, memory/project/current-state.md, AGENTS.md
- 文档：tasks/queue/task-015-release-accept-ui-stability.md

## 复盘

- 前端异常的直接根因是发布页动作缺少 `try/catch`，并且在会被关闭的 `dev` 预览页里执行 `router.refresh()`。
- 运行态漂移的根因是 `accept-dev-release` 先重启 production，再更新 active release；重启后的状态文件因此写入了旧的 logical release id。
- 修复后，`accept/reject` 成功会直接跳转到稳定页面，production 运行态会先 `markActive` 再重启，`prod:check` 已恢复通过。
