# MVP Implementation Plan

## 本轮做了什么

- 新增 kernel/shell MVP 所需的 5 个 YAML schema、4 个 YAML template 和 `kernel/kernel_manifest.yaml`
- 把 `bootstrap/project_brief.yaml` 迁到新结构，并保留最小旧配置迁移能力
- 实现 `attach`、`audit`、`proposal`、`bootstrap` 四个命令入口
- 实现 `apply-proposal` 对 kernel proposal 的最小自动应用能力，只处理 `auto_apply` 路径
- 扩大 `auto_apply` 到“缺失的协议层资产”场景：老项目缺失的 schema / template / kernel manifest / bootstrap scripts / 非业务语义 managed docs 可自动补齐；已有且有差异的资产仍留在 `proposal_required`
- 把 `tasks/templates/task-template.md` 与 `scripts/ai/create-task.ts` 补到默认带最小 machine facts：新 task 默认生成 `当前模式 / 分支`，并可显式写入 `关联模块 / 更新痕迹`，让 companion 的 `planned_files` 不再依赖手工补录
- 保留旧命令兼容：
  - `scaffold -> bootstrap`
  - `propose --prompt-file -> 旧文档 block proposal`
- 用当前仓库跑通 attach / audit / proposal，并把结果固化到 `examples/compounding-attach/`
- 新增和更新 Python 单测，覆盖：
  - brief/schema 校验
  - legacy attach
  - minimal bootstrap
  - kernel proposal 生成
  - blocked 资产识别

## 本轮明确不做什么

- 不自动修改核心业务代码
- 不自动修改部署主入口
- 不自动修改生产脚本
- 不扩展通用 apply 流程；当前 `apply-proposal` 仅自动应用 kernel proposal 里的 `auto_apply` 路径，或旧文档 block proposal
- 不把现有仓库里已经存在的协议文档静默改成 `auto_apply`；只有“缺失的安全资产”会被自动补齐
- 不做 profile / overlay / 复杂退役机制
- 不做大规模目录重构
- 不做自动经验升格流程；本轮只提供 experience promotion 合同文件

## 命令怎么跑

- 老项目接协议层：
  - `python3 scripts/init_project_compounding.py attach --target <repo> --config bootstrap/project_brief.yaml`
- 重新 attach：
  - `python3 scripts/init_project_compounding.py attach --target <repo> --config bootstrap/project_brief.yaml --adoption-mode reattach`
- 审计当前接入状态：
  - `python3 scripts/init_project_compounding.py audit --target <repo> --config bootstrap/project_brief.yaml`
- 生成 kernel proposal：
  - `python3 scripts/init_project_compounding.py proposal --target <repo> --config bootstrap/project_brief.yaml`
- 应用 kernel proposal 中的低风险路径：
  - `python3 scripts/init_project_compounding.py apply-proposal --target <repo> --proposal <proposal_id>`
- 新项目最小冷启动：
  - `python3 scripts/init_project_compounding.py bootstrap --target <repo> --config bootstrap/project_brief.yaml`
- 兼容入口：
  - `python3 scripts/init_project_compounding.py scaffold --target <repo> --config bootstrap/project_brief.yaml`
  - `python3 scripts/init_project_compounding.py propose --target <repo> --config bootstrap/project_brief.yaml --prompt-file <file>`

## 如何验证

- 当前仓库作为 attach 示例：
  - `python3 scripts/init_project_compounding.py attach --target . --config bootstrap/project_brief.yaml`
  - `python3 scripts/init_project_compounding.py audit --target . --config bootstrap/project_brief.yaml`
  - `python3 scripts/init_project_compounding.py proposal --target . --config bootstrap/project_brief.yaml`
- 老项目低风险 apply：
  - 先确保仓库已有 baseline commit 且 worktree 干净
  - `python3 scripts/init_project_compounding.py proposal --target <repo> --config bootstrap/project_brief.yaml`
  - `python3 scripts/init_project_compounding.py apply-proposal --target <repo> --proposal <proposal_id>`
- 新项目最小 bootstrap：
  - `tmpdir=$(mktemp -d)`
  - `python3 scripts/init_project_compounding.py bootstrap --target "$tmpdir" --config bootstrap/project_brief.yaml`
  - `python3 "$tmpdir/scripts/init_project_compounding.py" audit --target "$tmpdir" --config "$tmpdir/bootstrap/project_brief.yaml"`
- 单测：
  - `python3 -m unittest tests.test_coord_cli tests.test_bootstrap_scaffold_cli tests.test_bootstrap_proposals_cli`
  - `node --experimental-strip-types scripts/ai/validate-task-git-link.ts`
