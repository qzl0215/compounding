# compounding_bootstrap

## 模块目标

为当前仓库或新项目生成、审计、提案式改写 AI-Native Repo 骨架。

## 入口与拥有面

- CLI：`python3 scripts/init_project_compounding.py scaffold`
- CLI：`python3 scripts/init_project_compounding.py audit`
- CLI：`python3 scripts/init_project_compounding.py propose`
- Service：`scripts/compounding_bootstrap/bootstrap.py`
- Service：`scripts/compounding_bootstrap/audit.py`

## 常改文件

- `scripts/init_project_compounding.py`
- `scripts/compounding_bootstrap/bootstrap.py`
- `scripts/compounding_bootstrap/scaffold_assets.py`
- `scripts/compounding_bootstrap/catalog.py`
- `scripts/compounding_bootstrap/renderers_index.py`
- `bootstrap/project_bootstrap.yaml`
- `tests/test_bootstrap_scaffold_cli.py`

## 不变量

- bootstrap 输出必须更像执行合同与默认读链，不继续生成泛化说明书。
- canonical docs、memory、tasks、code_index 骨架只能有一套主源，不能静默保留失效结构。
- bootstrap 不成为第二套任务系统，也不直接依赖 Studio 运行态。

## 推荐校验

- `python3 -m unittest tests.test_bootstrap_scaffold_cli`
- `python3 -m unittest tests.test_bootstrap_proposals_cli`
- `python3 scripts/init_project_compounding.py audit --config bootstrap/project_brief.yaml --target .`

## 常见改动

- 调整 scaffold 输出的主干文档、脚本清单和默认读链。
- 调整 proposal / apply 的产物结构或 canonical asset 同步。
- 调整 bootstrap 输出的 module 合同、不变量和推荐校验内容。
