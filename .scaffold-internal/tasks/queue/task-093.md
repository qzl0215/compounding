# 修复最小脚手架壳的运维资产生成基线失效

## 任务摘要

- 任务 ID：`task-093`
- 短编号：`t-093`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  修复最小脚手架壳的运维资产生成基线失效
- 为什么现在：
  当前 validate:build 在干净 main 上也会因为最小 bootstrap shell 生成 operator assets 时缺少依赖而失败；这个基线问题已经直接阻塞 bootstrap 外部验证矩阵和后续结构收口。
- 承接边界：
  只修复最小 bootstrap shell 在生成 operator assets 时的基线依赖缺失，并补足能稳定锁住该行为的最小测试；不扩展 bootstrap 功能面，不顺手重构 operator contract。
- 完成定义：
  干净 worktree 上的最小 bootstrap shell 测试不再因 operator asset 生成失败而中断；相关回归测试能覆盖依赖缺失场景；validate:build 中对应失败点被消除或替换成更真实的后续失败。
- 交付轨道：`direct_merge`

## 执行合同

### 要做

- 修复最小 bootstrap shell 生成运维资产所需的最小依赖路径
- 补一条先失败后通过的仓级回归测试
- 校验 bootstrap 相关最小测试与必要门禁

### 不做

- 不扩展 bootstrap 产物范围
- 不重做 operator contract 结构
- 不处理与本问题无关的存量 validate:build 失败

### 约束

继续遵守主源/派生物边界；优先最小修复，不让最小 shell 重新膨胀成复制整仓；若需补依赖，必须能解释为什么它属于 bootstrap 最小运行合同。

### 关键风险

如果直接把过多 shared 依赖塞回最小 shell，会重新扩大 bootstrap 壳体；如果只做局部绕过而不补测试，基线问题会在后续资产生成中反复回归。

### 测试策略

- 为什么测：这次是稳定复现的基线失败修复，必须先用 failing test 锁住最小 bootstrap shell 的失败路径，再验证修复不回归。
- 测什么：- python3 -m unittest tests.test_bootstrap_scaffold_cli.BootstrapKernelShellTests.test_bootstrap_creates_minimal_shell_and_audit_passes
- 必要时补 bootstrap 相关单测
- pnpm validate:build 或其最小等价链路
- 不测什么：不做真实外部仓 attach 或发布链路验收。
- 当前最小集理由：优先锁住最小 shell 这个高频基线；它一旦失效，会把后续 bootstrap 验证都变成噪音。

## 交付结果

- 状态：done
- 体验验收结果：
  - `python3 -m unittest tests.test_bootstrap_scaffold_cli.BootstrapKernelShellTests.test_tooling_pack_includes_simple_yaml_dependency`
  - `python3 -m unittest tests.test_bootstrap_scaffold_cli.BootstrapKernelShellTests.test_yaml_loader_keeps_quoted_list_items_with_colon_as_strings`
  - `python3 -m unittest tests.test_bootstrap_scaffold_cli.BootstrapKernelShellTests.test_bootstrap_creates_minimal_shell_and_audit_passes`
  - `python3 -m unittest tests.test_ai_assets_cli.AiAssetsCliTests.test_validate_operator_contract_allows_blank_task_commands_without_ai_exec_pack`
  - `python3 -m unittest tests.test_bootstrap_scaffold_cli tests.test_ai_assets_cli`
  - `pnpm ai:validate-operator-contract`
  - `pnpm validate:build` 不再卡在最小 bootstrap shell 的 operator asset 基线；当前继续前进后暴露的是未触碰文件 `shared/project-judgement-live.ts` 的既有类型错误。
- 交付结果：
  - `tooling_pack` 现在会把 `shared/simple-yaml.ts` 一起导出，最小 shell 不再在生成 operator assets 时因缺依赖直接崩溃。
  - cold_start / governance operator contract 现在会补齐 `task_orchestration` 和 `task_transition` 的最小合同；没有 `ai_exec_pack` 时允许保留空执行命令，不再被 validator 误判。
  - Python bootstrap YAML 解析器不再把列表项里的冒号字符串误判成 mapping，现有 `bootstrap/project_operator.yaml` 与模板里的相关项也已补齐安全 quoting。
- 复盘：
  bootstrap 最小壳复制的是仓库自带的 `bootstrap/project_operator.yaml`，不是空白模板；因此一旦开始规范化 `task_orchestration`，就会把简化 YAML 解析器对“列表项内冒号”的误判一起放大。修复不能只补 pack 清单，还要同时补齐 schema 默认值和 YAML list 解析边界。

## 分支

`codex/task-093-bootstrap-operator-assets`

## 关联模块

- `scripts/compounding_bootstrap/`
- `scripts/ai/lib/operator-contract.ts`
- `scripts/ai/generate-operator-assets.ts`
- `shared/`
- `tests/test_bootstrap_scaffold_cli.py`
- `tests/test_bootstrap_golden_matrix.py`

## 更新痕迹

- 记忆：no change: 未更新
- 索引：no change: 未更新
- 路线图：no change: 未更新
- 文档：no change: 未更新
- 文档：updated: task 合同已记录 bootstrap 基线修复结果与剩余非本任务构建错误
