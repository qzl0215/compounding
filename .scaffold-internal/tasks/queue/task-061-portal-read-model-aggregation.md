# 任务 task-061-portal-read-model-aggregation

## 任务摘要

- 短编号：`t-061`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  收薄 portal 读模型聚合层
- 为什么现在：
  `apps/studio/src/modules/portal/builders.ts` 仍然把首页摘要、Kernel/Project tab 快照和运行态翻译揉在一起，是当前最大的单文件热点；继续扩 release 线收益更低，先把 portal 聚合层切薄更值钱。
- 承接边界：
  只把 `portal/builders.ts` 拆成更小的内部模块；继续通过现有 barrel 对外导出，保持 `service.ts`、`index.ts` 和 `home-dashboard.tsx` 的调用方式不变；不碰 release 兼容壳、不做 `types.ts` taxonomy 重构。
- 完成定义：
  `builders.ts` 退化为薄 barrel；首页默认 `Project` Tab、`Kernel / Project` 文案语义和 YAML / markdown 输入源保持不变；cleanup candidate 不再把 `builders.ts` 视为单文件热点。

## 执行合同

### 要做

- `apps/studio/src/modules/portal/builders.ts` 的内部职责拆分
- 首页/运行态摘要、Kernel tab snapshot、Project tab snapshot、治理分桶与共享 helper 的分层
- 相关最小回归测试与主源状态同步

### 不做

- release 兼容壳收口
- `portal` 新页面或新状态源
- `types.ts` 全量 taxonomy 重构
- `home-dashboard.tsx` 行为调整

### 约束

- 保持现有外部接口兼容
- 不改首页默认 tab、不改文案语义、不改输入源
- 不引入第二套读模型或新的长期状态文件

### 关键风险

如果拆分只是在文件层做搬家，`builders.ts` 仍会继续膨胀；如果 helper 边界切错，`service.ts` 和 UI 之间的 snapshot 语义会重新分叉。

### 测试策略

- 为什么测：这轮只改 portal 读模型内部结构，最容易出问题的是 snapshot 兼容和首页渲染回退。
- 测什么：`portal` service snapshot、`home-dashboard` 渲染、`builders.ts` 导出兼容、cleanup candidate 热点下降。
- 不测什么：不新增浏览器端端到端测试，不改 release 链路。
- 当前最小集理由：现有 `portal` 单测已经覆盖 snapshot 与渲染，补一轮结构拆分验证就够锁住行为。

## 交付结果

- 状态：done
- 体验验收结果：
  `portal/builders.ts` 已退化为薄 barrel，首页默认 Project Tab、Kernel / Project 语义和 markdown/YAML 输入源保持不变。
- 交付结果：
  首页/运行态摘要、Kernel tab snapshot、Project tab snapshot、治理分桶与共享 helper 已拆到 `apps/studio/src/modules/portal/builders/`；cleanup candidate 不再把 `builders.ts` 视为单文件热点。
- 复盘：
  这轮的关键不是继续堆更大的聚合文件，而是把入口、tab 快照与共享 helper 分层后，再把首页 shell 留到下一轮单独收口。

## 当前模式

工程执行

## 分支

`main`

## 关联模块

- `apps/studio/src/modules/portal/builders.ts`
- `apps/studio/src/modules/portal/builders/`
- `apps/studio/src/modules/portal/service.ts`
- `apps/studio/src/modules/portal/index.ts`
- `apps/studio/src/modules/portal/components/home-dashboard.tsx`
- `apps/studio/src/modules/portal/__tests__/service.test.ts`
- `apps/studio/src/modules/portal/__tests__/home-dashboard.test.tsx`
- `memory/project/roadmap.md`
- `memory/project/current-state.md`
- `memory/project/operating-blueprint.md`

## 更新痕迹

- 记忆：updated current-state / roadmap / operating-blueprint to focus on t-061 portal read model aggregation
- 索引：no change
- 路线图：set roadmap current priority to t-061 portal read model aggregation
- 文档：tasks/queue/task-061-portal-read-model-aggregation.md
