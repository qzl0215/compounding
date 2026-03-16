# task-007-local-prod-runtime-stability

## 目标

补齐当前仓库在 macOS 本地的生产运行时，让 `main` 对应的 release 能被手动稳定拉起、可探活、可切换、可回滚，并明确说明页面打不开或失样式时的真实原因。

## 为什么

当前仓库已经有 `releases/<id> + current` 的版本切换模型，但缺少本地常驻运行时。结果是 `127.0.0.1:3000` 依赖临时 `next dev` 或手工进程，导致页面会出现样式资源 404、连接拒绝或版本漂移，用户无法判断到底是页面坏了，还是服务根本没在跑。

## 范围

- 新增本地生产运行时脚本：启动、停止、状态、重启、健康检查
- 让 release 切换与回滚在本地运行中时自动最小重启
- 在 `/releases` 页面显示本地生产运行态
- 增加根命令与必要文档，明确“手动拉起、显式运行态、手动验收”的工作流
- 把本地运行时纳入 code index

## 范围外

- 自动开机或登录自启
- 远端 Linux 服务器部署
- 新增后台数据库或额外发布平台

## 约束

- `main` 仍是唯一生产主线
- 本地生产默认不自动拉起，只在明确执行 `prod:start` 时启动
- 若本地生产未运行，release 切换和回滚不得偷偷启动新进程
- 页面与脚本必须能直接解释“为什么打不开”

## 关联模块

- `apps/studio/src/modules/releases`
- `apps/studio/src/app/releases/page.tsx`
- `apps/studio/src/app/api/releases/*`
- `scripts/release/*`
- `scripts/local-runtime/*`
- `scripts/ai/generate-module-index.ts`
- `package.json`

## 当前模式

发布复盘

## 分支

`codex/task-007-local-prod-runtime-stability`

## 最近提交

`auto: branch HEAD`

## 计划

- 实现本地生产运行时脚本并写入运行态元数据
- 把 release reload fallback 接到本地运行时重启
- 在 `/releases` 展示运行态与漂移提示
- 准备并切换一次新的 release，再手动拉起本地生产完成验收

## 发布说明

这是本地生产稳定性修复。发布到 `main` 后，需先准备并切换新的 release，再手动执行一次 `pnpm prod:start`；之后若本地生产持续运行，后续切换/回滚会自动最小重启。

## 验收标准

- `pnpm prod:start`、`pnpm prod:stop`、`pnpm prod:status`、`pnpm prod:check` 可用
- `/releases` 能明确显示本地生产是未启动、运行中还是版本漂移
- 若本地生产正在运行，`release:switch` 与 `release:rollback` 会自动最小重启
- 本地生产启动后，`/`、`/tasks`、`/knowledge-base?path=AGENTS.md`、`/releases` 均返回 `200`
- 首页不再出现因为 CSS 资源 404 导致的裸页面

## 风险

- `3000` 端口可能仍被未托管的临时进程占用
- 旧 release 的 `current` 可能与运行中的进程不一致
- 本地 `.env` 与 `shared/portal.env` 可能存在漂移

## 状态

done

## 更新痕迹

- 记忆：`no change: historical task metadata alignment only`
- 索引：`no change: historical task metadata alignment only`
- 路线图：`no change: current priority unchanged`
- 文档：`tasks/queue/task-007-local-prod-runtime-stability.md`

## 复盘

- 本地页面的“裸 HTML / 连接拒绝”问题，根因不是页面渲染崩溃，而是缺少受控的本地生产运行时。
- 以后要先看运行态：release registry 管版本，local runtime 管端口；两者缺一都会让生产状态失真。
- 运行中的生产进程必须显式注入 workspace/release 根目录；否则页面即使返回 `200`，也可能读取到错误的运行态上下文。
