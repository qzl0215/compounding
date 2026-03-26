# 扩展高频摘要覆盖并落地令牌效率看板

## 任务摘要

- 任务 ID：`task-074`
- 短编号：`t-074`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  扩展高频摘要覆盖并落地令牌效率看板
- 为什么现在：
  把高ROI摘要覆盖扩到读仓与差异类高噪音场景，并把令牌消耗与节省结果可视化，直接提升AI开发效率与可感知性
- 承接边界：
  仅扩展repo-native摘要wrapper、command-gain聚合与Studio看板，不改全局hook与用户环境
- 完成定义：
  新增高ROI摘要wrapper并输出统一看板契约，Studio可查看令牌消耗与节省摘要，相关静态与测试门禁通过

## 执行合同

### 要做

scripts/ai、shared、apps/studio、tests、operator assets

### 不做

全局shell代理、home目录配置、SQLite与遥测

### 约束

保持单一tracking数据源，尽量复用现有project-state与command-gain实现

### 关键风险

若read/find/tree/diff策略过重，可能引入噪音或过度裁剪，需要先做最小profile并用fixture约束

### 测试策略

- 为什么测：这是结构性能力扩展，需验证wrapper、看板契约与Studio显示一致
- 测什么：python3 -m unittest相关tests；pnpm ai:validate:static:summary；必要的studio test/build
- 不测什么：
- 当前最小集理由：高，直接影响AI效率覆盖面和量化可视化

## 交付结果

- 状态：
- 体验验收结果：
  
- 交付结果：
  
- 复盘：
  

## 当前模式

工程执行

## 分支

`codex/task-074`

## 关联模块



## 更新痕迹

- 记忆：no change: 未更新
- 索引：no change: 未更新
- 路线图：no change: 未更新
- 文档：no change: 未更新
