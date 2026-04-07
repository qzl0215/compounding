# 任务 task-043-gstack-roi-absorption-refresh

## 任务摘要

- 短编号：`t-043`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  刷新 gstack 的高 ROI 吸收清单，并产出下一批低熵增执行 task
- 为什么现在：
  `t-042` 已把 plan / task / companion / release 的边界切干净；现在再看 gstack，才能只吸收会带来复利的轻流程思想，而不是把重基础设施或第二份状态源带进来。
- 承接边界：
  从当前单层 plan、执行合同、最小 companion 与最小 release 出发，只提炼仍值得继续吸收的增量经验，形成新的 ROI 排序、经验文档和后续执行 task。
- 完成定义：
  已产出 `exp-007`，并同步 `operating-blueprint / roadmap / current-state`；`t-044 ~ t-046` 已创建，且分别承接 Search Before Building、Autoplan 人机决策收口、Diff-based test ROI 优化三条主线。

## 执行合同

### 要做

- 重读 gstack 的 README、ETHOS、CLAUDE 与结构入口，只提炼轻流程、轻门禁、轻测试治理思想。
- 把 Search Before Building、Boil the Lake、Autoplan、Diff-based test selection 映射到本仓库现有对象和文档边界。
- 产出一份新的经验文档，并创建 2 到 3 条明确执行 task。
- 同步 `operating-blueprint`、`roadmap` 与 `current-state`，把下一阶段主线切到新的 ROI 吸收任务。

### 不做

- 不重复 `t-030` 的“能不能吸收”总判断。
- 不引入 Bun daemon、浏览器持久化基础设施、Claude 绑定生态或新的长期状态源。
- 不直接实现 `t-044 ~ t-046`。

### 约束

- 继续只允许一层 plan，唯一主源仍是 `memory/project/operating-blueprint.md`。
- 吸收的是思想和轻流程，不是 gstack 的基础设施形态。
- 新任务必须边界清楚、可执行、低熵增，不能把研究结果变成大而散的 backlog。

### 关键风险

- 如果只是重写一版 gstack 点评文档，而没有明确到本仓库落点和后续 task，这轮规划就没有实际 ROI。
- 如果把 Search Before Building 或 Autoplan 做成新的流程负担，反而会降低 AI 自主能力。

### 测试策略

- 为什么测：这轮是主线规划收口，必须保证 task、experience、roadmap、current-state、operating-blueprint 五者口径一致。
- 测什么：新增 task 的结构合法性、经验索引生成、change trace、task git link 与本地 production 健康状态。
- 不测什么：不为规划文案本身补 UI 快照，也不新增新的门禁层。
- 当前最小集理由：只锁主线一致性和任务合法性，避免让 planning 文书又衍生出新的维护系统。

## 交付结果

- 状态：done
- 体验验收结果：
  gstack 的高 ROI 吸收项已重新梳理，后续执行主线已变成明确可开工的 `t-044 ~ t-046`。
- 交付结果：
  已产出 `exp-007-gstack-roi-refresh`，并把主线文档切到新的 ROI 吸收方向。
- 复盘：
  外部框架值得吸收的通常不是基础设施，而是能嵌入现有对象边界的判断规则和轻流程。
