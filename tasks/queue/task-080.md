# 收口学习信号晋升链

## 任务摘要

- 任务 ID：`task-080`
- 短编号：`t-080`
- 父计划：``
- 任务摘要：
  收口学习信号晋升链
- 为什么现在：
  当前已有 retro/context/command-gain 线索，但还没有统一的 learning candidate 与晋升链，导致复盘只能被看到，不能稳定转成 harness 复利。
- 承接边界：
  只覆盖 execution_blocker 与 shortcut_gap；统一 learning signal/candidate/proposal contract；新增 learning-candidates 聚合入口并接回 preflight、feature-context、build-context 与 ai-efficiency；晋升语义固定为先回 operating-blueprint 再派生 task，不自动改主源。
- 完成定义：
  pnpm ai:learning-candidates 可稳定输出 candidate 与 promotion proposal；preflight/feature-context/build-context 会显示当前 task learning hints；release 前后会刷新 candidate snapshot；不新增长期状态源且 output/* 仍只作派生物。

## 执行合同

### 要做



### 不做

不处理 user correction 与 capability gap；不做全局 hook；不自动改写 AGENTS/docs/memory/tasks。

### 约束

truth source 只读 companion iteration_digest、task activity/live summary 与 output/ai/command-gain/events.jsonl；pattern_key 必须稳定且不依赖 taskId；proposal 目标固定为 operating-blueprint planning item + task draft scaffold。

### 关键风险

若把单次噪声直接候选化，会放大学习链噪音；若 promotion 语义越过 blueprint 直接写主源，会破坏现有治理；若在 preflight 早期写文件，会把 clean worktree 写脏。

### 测试策略

- 为什么测：这是 harness 主链结构改动，必须证明触发阈值、候选聚合、proposal 生成、入口 hints 与 release-bound refresh 都稳定。
- 测什么：tests/test_ai_learning_candidates.py、tests/test_ai_feature_context.py、tests/test_coord_cli.py、tests/test_ai_assets_cli.py、Studio 相关模块测试与 ai:learning-candidates CLI smoke。
- 不测什么：不做全局 hook、用户环境、远端调度与 capability gap 的端到端测试。
- 当前最小集理由：high

## 交付结果

- 状态：
- 体验验收结果：
  
- 交付结果：
  
- 复盘：
  

## 当前模式

工程执行

## 分支

`codex/task-080`

## 关联模块



## 更新痕迹

- 记忆：no change: 未更新
- 索引：no change: 未更新
- 路线图：no change: 未更新
- 文档：no change: 未更新
