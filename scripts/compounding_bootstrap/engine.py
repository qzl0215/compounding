from __future__ import annotations

import argparse
import difflib
import hashlib
import json
import os
import re
import subprocess
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


REQUIRED_FRONTMATTER = [
    "title",
    "owner_role",
    "status",
    "last_reviewed_at",
    "source_of_truth",
    "related_docs",
]

EVIDENCE_BOUNDARY_TITLES = [
    "本地离线证据",
    "服务器真实证据",
    "当前结论适用边界",
]

LEGACY_TERMS = [
    "ranking_app_parallel",
    "PG/Qdrant",
    "ranking-app-parallel",
    "legacy_project_name",
]

MANAGED_FRONTMATTER_FIELDS = [
    "title",
    "owner_role",
    "status",
    "last_reviewed_at",
    "source_of_truth",
    "related_docs",
]

HARDENING_REGISTRY_PATH = "bootstrap/canonical_hardening.json"
BRIEF_PATH = "bootstrap/project_brief.yaml"
LEGACY_CONFIG_PATH = "bootstrap/project_bootstrap.yaml"
BRIEF_SCHEMA_PATH = "bootstrap/schemas/project_brief.schema.json"
RESOLVED_CONFIG_PATH = "output/bootstrap/project_bootstrap.resolved.yaml"
BASELINE_COMMIT_MESSAGE = "chore: baseline bootstrap initialization"
IGNORED_WORKTREE_PATH_PREFIXES = ("output/proposals/", "output/manual-prompts/")

CORE_DOCS = [
    "docs/PROJECT_CARD.md",
    "docs/OPERATING_RULES.md",
    "docs/ORG_MODEL.md",
    "docs/PLAYBOOK.md",
    "docs/MEMORY_LEDGER.md",
]

DOC_META: dict[str, dict[str, Any]] = {
    "docs/PROJECT_CARD.md": {
        "title": "PROJECT_CARD",
        "owner_role": "Foreman",
        "related_docs": ["docs/OPERATING_RULES.md", "docs/PLAYBOOK.md", "docs/MEMORY_LEDGER.md"],
    },
    "docs/OPERATING_RULES.md": {
        "title": "OPERATING_RULES",
        "owner_role": "Architect",
        "related_docs": ["docs/PROJECT_CARD.md", "docs/PLAYBOOK.md", "docs/ORG_MODEL.md"],
    },
    "docs/ORG_MODEL.md": {
        "title": "ORG_MODEL",
        "owner_role": "Foreman",
        "related_docs": ["docs/PROJECT_CARD.md", "docs/OPERATING_RULES.md"],
    },
    "docs/PLAYBOOK.md": {
        "title": "PLAYBOOK",
        "owner_role": "Builder",
        "related_docs": ["docs/PROJECT_CARD.md", "docs/OPERATING_RULES.md", "docs/MEMORY_LEDGER.md"],
    },
    "docs/MEMORY_LEDGER.md": {
        "title": "MEMORY_LEDGER",
        "owner_role": "Auditor",
        "related_docs": ["docs/PROJECT_CARD.md", "docs/PLAYBOOK.md"],
    },
}

DEFAULT_VALUES = [
    "单一真相入口",
    "先证据后判断",
    "先收敛后扩张",
    "复杂度净减少",
    "可回滚与可审计",
]

DEFAULT_OPERATING_PRINCIPLES = [
    "项目说明先于局部优化。",
    "所有实质性改动先生成 review，再确认写入。",
    "Git 文件即真相；不要让口头约定成为真实规则。",
    "能自动推导的治理信息，不要求小白手动输入。",
]

DEFAULT_DECISION_POLICY = {
    "tiers": [
        {"name": "Strategic", "proposer": "Foreman", "approver": "Board", "examples": ["改目标", "改保护边界"]},
        {"name": "Structural", "proposer": "Architect", "approver": "Foreman", "examples": ["改规则", "改工作流"]},
        {"name": "Operational", "proposer": "Builder", "approver": "Architect", "examples": ["做任务", "修实现"]},
    ]
}

DEFAULT_REPORTING_CONTRACT = {
    "default_sections": ["目标", "已完成", "风险", "下一步"],
    "required_fields": ["本地离线证据", "服务器真实证据", "当前结论适用边界"],
}

DEFAULT_ROLES = [
    {
        "department": "Executive Office",
        "role": "Foreman",
        "responsibilities": ["维护项目级优先级", "把复杂治理翻译成简单行动", "决定下一条最值得做的事"],
        "reports_to": "Board",
        "scope": ["strategy", "project-card", "review"],
    },
    {
        "department": "Architecture",
        "role": "Architect",
        "responsibilities": ["维护规则边界", "避免平行体系", "让 agent 输入输出更稳定"],
        "reports_to": "Foreman",
        "scope": ["rules", "playbook", "structure"],
    },
    {
        "department": "Delivery",
        "role": "Builder",
        "responsibilities": ["执行任务", "交付改动", "保持变更可验证可回滚"],
        "reports_to": "Architect",
        "scope": ["implementation", "task-delivery"],
    },
    {
        "department": "Quality",
        "role": "Auditor",
        "responsibilities": ["审查风险", "维护 memory ledger", "阻止无证据结论进入真相源"],
        "reports_to": "Foreman",
        "scope": ["review", "evidence", "memory"],
    },
]


@dataclass
class AuditResult:
    passed: bool
    errors: list[str]
    warnings: list[str]
    checked_files: list[str]
    missing_assets: list[str]
    conflicting_rules: list[str]
    hardcoded_legacy_terms: list[str]


class SimpleYamlParser:
    def __init__(self, text: str):
        self.lines = text.splitlines()
        self.index = 0

    def parse(self) -> Any:
        self._skip_blanks()
        if self.index >= len(self.lines):
            return {}
        return self._parse_block(self._indent_of(self.lines[self.index]))

    def _parse_block(self, indent: int) -> Any:
        self._skip_blanks()
        if self.index >= len(self.lines):
            return {}
        line = self.lines[self.index]
        if self._is_list_item(line, indent):
            return self._parse_list(indent)
        return self._parse_mapping(indent, {})

    def _parse_list(self, indent: int) -> list[Any]:
        items: list[Any] = []
        while self.index < len(self.lines):
            self._skip_blanks()
            if self.index >= len(self.lines):
                break
            line = self.lines[self.index]
            if not self._is_list_item(line, indent):
                break
            item_text = line[indent + 2 :].strip()
            self.index += 1
            if item_text == "":
                items.append(self._parse_block(indent + 2))
                continue
            if self._looks_like_mapping(item_text):
                key, rest = self._split_key_value(item_text)
                item_mapping: dict[str, Any] = {}
                if rest == "":
                    item_mapping[key] = self._parse_block(indent + 4)
                else:
                    item_mapping[key] = self._parse_scalar(rest)
                item_mapping = self._parse_mapping(indent + 2, item_mapping)
                items.append(item_mapping)
                continue
            items.append(self._parse_scalar(item_text))
        return items

    def _parse_mapping(self, indent: int, initial: dict[str, Any]) -> dict[str, Any]:
        mapping = initial
        while self.index < len(self.lines):
            self._skip_blanks()
            if self.index >= len(self.lines):
                break
            line = self.lines[self.index]
            current_indent = self._indent_of(line)
            if current_indent < indent or self._is_list_item(line, indent):
                break
            if current_indent != indent:
                break
            stripped = line[indent:]
            key, rest = self._split_key_value(stripped)
            self.index += 1
            if rest == "":
                self._skip_blanks()
                if self.index < len(self.lines) and self._indent_of(self.lines[self.index]) > indent:
                    mapping[key] = self._parse_block(indent + 2)
                else:
                    mapping[key] = {}
            else:
                mapping[key] = self._parse_scalar(rest)
        return mapping

    def _skip_blanks(self) -> None:
        while self.index < len(self.lines):
            stripped = self.lines[self.index].strip()
            if stripped == "" or stripped.startswith("#"):
                self.index += 1
                continue
            break

    @staticmethod
    def _indent_of(line: str) -> int:
        return len(line) - len(line.lstrip(" "))

    @staticmethod
    def _split_key_value(text: str) -> tuple[str, str]:
        key, _, rest = text.partition(":")
        return key.strip(), rest.strip()

    @staticmethod
    def _is_list_item(line: str, indent: int) -> bool:
        return len(line) >= indent + 2 and line.startswith(" " * indent + "- ")

    @staticmethod
    def _looks_like_mapping(text: str) -> bool:
        return ":" in text and not text.startswith(("http://", "https://"))

    @staticmethod
    def _parse_scalar(text: str) -> Any:
        if text.startswith('"') and text.endswith('"'):
            return text[1:-1]
        if text.startswith("'") and text.endswith("'"):
            return text[1:-1]
        lowered = text.lower()
        if lowered == "true":
            return True
        if lowered == "false":
            return False
        if lowered == "null":
            return None
        if re.fullmatch(r"-?\d+", text):
            return int(text)
        return text


def load_yaml(path: Path) -> dict[str, Any]:
    parser = SimpleYamlParser(path.read_text(encoding="utf8"))
    data = parser.parse()
    if not isinstance(data, dict):
        raise ValueError(f"Config at {path} must parse to an object.")
    return data


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf8"))


def today_iso() -> str:
    return datetime.now(timezone.utc).date().isoformat()


def slugify(value: str) -> str:
    lowered = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return lowered or "ai-os-project"


def yaml_scalar(value: Any) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    if value is None:
        return "null"
    if isinstance(value, (int, float)):
        return str(value)
    text = str(value)
    if text == "" or re.search(r"[:#\n]", text) or text != text.strip() or text.startswith("-"):
        return json.dumps(text, ensure_ascii=False)
    return text


def dump_yaml_lines(data: Any, indent: int = 0) -> list[str]:
    space = " " * indent
    if isinstance(data, dict):
        if not data:
            return [space + "{}"]
        lines: list[str] = []
        for key, value in data.items():
            if isinstance(value, dict):
                lines.append(f"{space}{key}:")
                lines.extend(dump_yaml_lines(value, indent + 2))
            elif isinstance(value, list):
                lines.append(f"{space}{key}:")
                lines.extend(dump_yaml_lines(value, indent + 2))
            else:
                lines.append(f"{space}{key}: {yaml_scalar(value)}")
        return lines
    if isinstance(data, list):
        if not data:
            return [space + "[]"]
        lines = []
        for item in data:
            if isinstance(item, dict):
                if not item:
                    lines.append(f"{space}- {{}}")
                    continue
                items = list(item.items())
                first_key, first_value = items[0]
                if isinstance(first_value, (dict, list)):
                    lines.append(f"{space}- {first_key}:")
                    lines.extend(dump_yaml_lines(first_value, indent + 4))
                else:
                    lines.append(f"{space}- {first_key}: {yaml_scalar(first_value)}")
                for next_key, next_value in items[1:]:
                    if isinstance(next_value, (dict, list)):
                        lines.append(f"{space}  {next_key}:")
                        lines.extend(dump_yaml_lines(next_value, indent + 4))
                    else:
                        lines.append(f"{space}  {next_key}: {yaml_scalar(next_value)}")
                continue
            if isinstance(item, list):
                lines.append(f"{space}- ")
                lines.extend(dump_yaml_lines(item, indent + 2))
                continue
            lines.append(f"{space}- {yaml_scalar(item)}")
        return lines
    return [space + yaml_scalar(data)]


def dump_yaml(data: dict[str, Any]) -> str:
    return "\n".join(dump_yaml_lines(data)) + "\n"


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def write_yaml(path: Path, data: dict[str, Any]) -> None:
    ensure_parent(path)
    path.write_text(dump_yaml(data), encoding="utf8")


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf8")


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf8")).hexdigest()


def extract_managed_block(text: str, block_name: str) -> str:
    match = re.search(
        rf"<!-- BEGIN MANAGED BLOCK: {re.escape(block_name)} -->(.*?)<!-- END MANAGED BLOCK: {re.escape(block_name)} -->",
        text,
        re.DOTALL,
    )
    if not match:
        return ""
    return match.group(1).strip()


def split_frontmatter(text: str) -> tuple[dict[str, Any], str]:
    if not text.startswith("---\n"):
        return {}, text
    parts = text.split("---\n", 2)
    if len(parts) < 3:
        return {}, text
    return parse_frontmatter(text), parts[2].lstrip("\n")


def serialize_frontmatter(data: dict[str, Any]) -> str:
    lines = ["---"]
    for key, value in data.items():
        if isinstance(value, list):
            lines.append(f"{key}:")
            for item in value:
                lines.append(f"  - {item}")
            continue
        lines.append(f"{key}: {value}")
    lines.append("---")
    return "\n".join(lines) + "\n\n"


def build_frontmatter(relative_path: str, existing_meta: dict[str, Any] | None, canonical_changed: bool) -> str:
    meta = DOC_META[relative_path]
    merged = dict(existing_meta or {})
    merged["title"] = meta["title"]
    merged["owner_role"] = meta["owner_role"]
    merged["status"] = str(merged.get("status", "active"))
    if canonical_changed or "last_reviewed_at" not in merged:
        merged["last_reviewed_at"] = today_iso()
    merged["source_of_truth"] = BRIEF_PATH
    merged["related_docs"] = meta["related_docs"]

    ordered: dict[str, Any] = {}
    for key in MANAGED_FRONTMATTER_FIELDS:
        ordered[key] = merged.get(key)
    for key, value in merged.items():
        if key not in ordered:
            ordered[key] = value
    return serialize_frontmatter(ordered)


def wrap_managed_block(name: str, content: str) -> str:
    normalized = content.strip()
    return (
        f"<!-- BEGIN MANAGED BLOCK: {name} -->\n"
        f"{normalized}\n"
        f"<!-- END MANAGED BLOCK: {name} -->"
    )


def replace_managed_block(existing: str, block_name: str, new_content: str) -> str:
    pattern = re.compile(
        rf"<!-- BEGIN MANAGED BLOCK: {re.escape(block_name)} -->.*?<!-- END MANAGED BLOCK: {re.escape(block_name)} -->",
        re.DOTALL,
    )
    replacement = wrap_managed_block(block_name, new_content)
    if pattern.search(existing):
        return pattern.sub(replacement, existing, count=1)
    manual_marker = "## Manual Notes"
    insertion = replacement + "\n\n"
    if manual_marker in existing:
        return existing.replace(manual_marker, insertion + manual_marker, 1)
    return existing.rstrip() + "\n\n" + insertion


def ensure_frontmatter(existing: str, relative_path: str, canonical_changed: bool) -> str:
    existing_meta, rest = split_frontmatter(existing)
    frontmatter = build_frontmatter(relative_path, existing_meta, canonical_changed)
    return frontmatter + rest.lstrip("\n")


def render_evidence_boundary(root: Path) -> str:
    return read_text(root / "bootstrap" / "managed_blocks" / "evidence_boundary.md")


def render_fixed_report_structure(root: Path) -> str:
    return read_text(root / "bootstrap" / "managed_blocks" / "fixed_report_structure.md")


def parse_frontmatter(text: str) -> dict[str, Any]:
    if not text.startswith("---\n"):
        return {}
    parts = text.split("---\n", 2)
    if len(parts) < 3:
        return {}
    data: dict[str, Any] = {}
    raw_lines = parts[1].splitlines()
    current_key = None
    for line in raw_lines:
        if line.startswith("  - ") and current_key:
            data.setdefault(current_key, []).append(line[4:].strip())
            continue
        if ":" in line:
            key, value = line.split(":", 1)
            key = key.strip()
            value = value.strip()
            current_key = key
            if value:
                data[key] = value
            else:
                data[key] = []
    return data


def load_hardening_registry(root: Path) -> dict[str, list[dict[str, str]]]:
    path = root / HARDENING_REGISTRY_PATH
    if not path.exists():
        return {}
    payload = load_json(path)
    if isinstance(payload, dict):
        return payload
    return {}


def save_hardening_registry(root: Path, registry: dict[str, list[dict[str, str]]]) -> None:
    path = root / HARDENING_REGISTRY_PATH
    ensure_parent(path)
    path.write_text(json.dumps(registry, indent=2, ensure_ascii=False) + "\n", encoding="utf8")


def render_canonical_hardening(relative_path: str, root: Path, registry: dict[str, list[dict[str, str]]] | None = None) -> str:
    resolved = registry if registry is not None else load_hardening_registry(root)
    entries = resolved.get(relative_path, [])
    if not entries:
        return ""
    sections = []
    for entry in entries:
        sections.append(
            f"### {entry['title']}\n"
            f"- Proposal ID: `{entry['proposal_id']}`\n"
            f"- Intent: {entry['intent']}\n"
            f"- Scope: {entry['scope']}\n"
            f"- Follow-up: 若该硬化已足够稳定，应继续收敛回 project brief 或默认 playbook。"
        )
    return "\n\n## Ratified Hardening\n\n" + "\n\n".join(sections)


def brief_from_legacy_config(legacy: dict[str, Any]) -> dict[str, Any]:
    primary_goal = next(iter(legacy.get("primary_goals", [])), legacy.get("north_star_metric", legacy.get("project_one_liner", "")))
    current_priority = next(iter(legacy.get("short_term_priorities", [])), primary_goal)
    must_protect = legacy.get("frozen_items", [])
    if not must_protect:
        must_protect = ["保持 Git 文件即真相", "避免引入平行体系"]
    return {
        "project_name": legacy.get("project_name", "AI OS Project"),
        "project_one_liner": legacy.get("project_one_liner", "用更轻的治理底座帮助用户高效用好 agent。"),
        "success_definition": legacy.get("north_star_metric", primary_goal),
        "current_priority": current_priority,
        "must_protect": must_protect,
        "runtime_boundary": legacy.get("runtime_boundary", "server-only"),
    }


def infer_package_manager(target: Path) -> str:
    if (target / "pnpm-lock.yaml").exists():
        return "pnpm"
    if (target / "yarn.lock").exists():
        return "yarn"
    if (target / "package-lock.json").exists():
        return "npm"
    if (target / "uv.lock").exists() or (target / "pyproject.toml").exists():
        return "uv/pip"
    return "unknown"


def infer_commands(target: Path) -> tuple[str, str]:
    package_json = target / "package.json"
    if package_json.exists():
        try:
            payload = json.loads(package_json.read_text(encoding="utf8"))
            scripts = payload.get("scripts", {})
            build_command = "pnpm build" if "build" in scripts else "No build command detected"
            test_command = "pnpm test" if "test" in scripts else "No test command detected"
            return build_command, test_command
        except json.JSONDecodeError:
            pass
    return "No build command detected", "No test command detected"


def scan_repo(target: Path) -> dict[str, Any]:
    languages: set[str] = set()
    main_directories: list[str] = []
    ignored_roots = {
        ".git",
        "node_modules",
        ".next",
        "__pycache__",
        ".pytest_cache",
        "bootstrap",
        "deploy",
        "docs",
        "output",
        "scripts",
    }
    for entry in sorted(target.iterdir(), key=lambda item: item.name):
        if not entry.is_dir():
            continue
        if entry.name in ignored_roots or entry.name.startswith("."):
            continue
        main_directories.append(entry.name)

    extension_map = {
        ".ts": "TypeScript",
        ".tsx": "TypeScript",
        ".js": "JavaScript",
        ".jsx": "JavaScript",
        ".py": "Python",
        ".md": "Markdown",
    }
    for root, dirs, files in os.walk(target):
        relative_root = Path(root).relative_to(target).as_posix()
        dirs[:] = [name for name in dirs if name not in ignored_roots and not name.startswith(".")]
        if any(relative_root.startswith(prefix) for prefix in ["output", "dist", "build"]):
            dirs[:] = []
            continue
        for filename in files:
            suffix = Path(filename).suffix
            mapped = extension_map.get(suffix)
            if mapped:
                languages.add(mapped)

    build_command, test_command = infer_commands(target)
    lanes: dict[str, str] = {}
    for directory in main_directories:
        if directory in {"apps", "packages", "src", "scripts", "docs", "bootstrap", "tests", "deploy"}:
            lanes[directory] = f"{directory}/**"
    hot_files = [path for path in ["AGENTS.md", "README.md", "package.json", BRIEF_PATH] if (target / path).exists()]
    return {
        "languages": sorted(languages) or ["Unknown"],
        "package_manager": infer_package_manager(target),
        "main_directories": main_directories,
        "build_command": build_command,
        "test_command": test_command,
        "lanes": lanes or {"project": "**/*"},
        "hot_files": hot_files or [BRIEF_PATH],
    }


def infer_enabled_modules(target: Path, legacy: dict[str, Any] | None) -> dict[str, bool]:
    if legacy and isinstance(legacy.get("enabled_modules"), dict):
        return legacy["enabled_modules"]
    return {
        "ui_system": (target / "apps" / "studio").exists(),
        "server_truth_ledger": (target / "scripts" / "server_truth_ledger.py").exists(),
        "quant_review": (target / "scripts" / "foreman_quant_review.py").exists(),
        "evidence_boundary": True,
        "anti_entropy": True,
        "tech_debt": (target / "docs" / "70_MEMORY" / "TECH_DEBT.md").exists(),
    }


def derive_resolved_config(brief: dict[str, Any], target: Path, legacy: dict[str, Any] | None = None) -> dict[str, Any]:
    scan = scan_repo(target)
    project_slug = (legacy or {}).get("project_slug") or slugify(brief["project_name"])
    primary_priority = brief["current_priority"]
    must_protect = brief["must_protect"]
    allowed_scopes = [pattern for pattern in scan["lanes"].values()]
    return {
        "project_name": brief["project_name"],
        "project_slug": project_slug,
        "project_one_liner": brief["project_one_liner"],
        "default_language": (legacy or {}).get("default_language", "zh-CN"),
        "repo_kind": (legacy or {}).get("repo_kind", "software-multi-agent"),
        "scm_flow": (legacy or {}).get("scm_flow", "github-pr-rebase"),
        "runtime_boundary": brief["runtime_boundary"],
        "success_definition": brief["success_definition"],
        "current_priority": primary_priority,
        "must_protect": must_protect,
        "primary_goals": [brief["success_definition"], primary_priority],
        "primary_chains": [
            "initialize -> task -> review -> memory",
            "brief -> resolved config -> proposal -> apply",
        ],
        "allowed_scopes": allowed_scopes or ["**/*"],
        "frozen_items": must_protect,
        "high_risk_actions": [
            "跳过 review 直接改写仓库",
            "引入新的平行治理体系",
            "无证据扩张 agent 的职责边界",
        ],
        "lanes": scan["lanes"],
        "hot_files": scan["hot_files"],
        "validation_modes": (legacy or {}).get("validation_modes", ["prod-live", "local-code-prod-data", "full-local"]),
        "enabled_modules": infer_enabled_modules(target, legacy),
        "template_profile": "virtual-company-light",
        "company_mission": brief["project_one_liner"],
        "company_vision": brief["success_definition"],
        "company_values": (legacy or {}).get("company_values", DEFAULT_VALUES),
        "operating_principles": (legacy or {}).get("operating_principles", DEFAULT_OPERATING_PRINCIPLES),
        "org_structure": (legacy or {}).get("org_structure", DEFAULT_ROLES),
        "decision_policy": (legacy or {}).get("decision_policy", DEFAULT_DECISION_POLICY),
        "reporting_contract": (legacy or {}).get("reporting_contract", DEFAULT_REPORTING_CONTRACT),
        "knowledge_domains": ["PROJECT_CARD", "OPERATING_RULES", "ORG_MODEL", "PLAYBOOK", "MEMORY_LEDGER"],
        "north_star_metric": brief["success_definition"],
        "short_term_priorities": [primary_priority],
        "long_term_compounding_axes": [
            "让小白更快用好 agent",
            "减少项目初始化的管理成本",
            "把治理知识沉到底层自动执行",
        ],
        "rewrite_policy": "proposal-preview-confirm-apply",
        "version_policy": "git-files-source-of-truth",
        "ui_preferences": "dark-command-center",
        "repo_scan": scan,
    }


def load_legacy_config(target: Path, config_path: Path) -> dict[str, Any] | None:
    legacy_path = target / LEGACY_CONFIG_PATH
    if config_path.resolve() == legacy_path.resolve():
        return None
    if not legacy_path.exists():
        return None
    try:
        return load_yaml(legacy_path)
    except ValueError:
        return None


def resolve_brief_and_config(config_path: Path, target: Path) -> tuple[dict[str, Any], dict[str, Any]]:
    raw = load_yaml(config_path)
    if "success_definition" in raw and "current_priority" in raw and "must_protect" in raw:
        brief = raw
    else:
        brief = brief_from_legacy_config(raw)
    validate_config(brief, target / BRIEF_SCHEMA_PATH)
    legacy = load_legacy_config(target, config_path) or (raw if "project_slug" in raw else None)
    resolved = derive_resolved_config(brief, target, legacy)
    return brief, resolved


def write_resolved_config(target: Path, resolved: dict[str, Any]) -> None:
    write_yaml(target / RESOLVED_CONFIG_PATH, resolved)


def maybe_write_brief(target: Path, config_path: Path, brief: dict[str, Any]) -> None:
    if config_path.name == "project_bootstrap.yaml" or not (target / BRIEF_PATH).exists():
        write_yaml(target / BRIEF_PATH, brief)


def _type_matches(expected_type: str, value: Any) -> bool:
    if expected_type == "string":
        return isinstance(value, str)
    if expected_type == "array":
        return isinstance(value, list)
    if expected_type == "object":
        return isinstance(value, dict)
    return True


def collect_config_errors(config: dict[str, Any], schema_path: Path) -> dict[str, str]:
    schema = load_json(schema_path)
    errors: dict[str, str] = {}
    for key in schema["required"]:
        if key not in config:
            errors[key] = "This field is required."
    for key, property_schema in schema["properties"].items():
        if key not in config:
            continue
        value = config[key]
        expected_type = property_schema.get("type")
        if expected_type and not _type_matches(expected_type, value):
            errors[key] = f"Expected {expected_type}."
            continue
        if property_schema.get("enum") and value not in property_schema["enum"]:
            errors[key] = f"Expected one of: {', '.join(property_schema['enum'])}"
            continue
        if expected_type == "array" and property_schema.get("items", {}).get("type") == "string":
            if not isinstance(value, list) or not value or not all(isinstance(item, str) and item.strip() for item in value):
                errors[key] = "Array items must be non-empty strings."
    return errors


def validate_config(config: dict[str, Any], schema_path: Path) -> None:
    errors = collect_config_errors(config, schema_path)
    if errors:
        raise ValueError("; ".join(f"{key}: {value}" for key, value in errors.items()))


def validate_config_file(config_path: Path, target: Path) -> dict[str, Any]:
    raw = load_yaml(config_path)
    brief = raw if "success_definition" in raw else brief_from_legacy_config(raw)
    errors = collect_config_errors(brief, target / BRIEF_SCHEMA_PATH)
    return {
        "ok": not errors,
        "message": "Config is valid." if not errors else "Config validation failed.",
        "field_errors": errors,
    }


def render_project_card(config: dict[str, Any], root: Path, registry: dict[str, list[dict[str, str]]] | None = None) -> str:
    scan = config["repo_scan"]
    evidence = render_evidence_boundary(root)
    hardening = render_canonical_hardening("docs/PROJECT_CARD.md", root, registry)
    return f"""# Project Card

## 项目定义

- 项目名称：{config['project_name']}
- 项目一句话：{config['project_one_liner']}
- 当前优先级：{config['current_priority']}
- 成功定义：{config['success_definition']}
- 必须保护：{", ".join(config['must_protect'])}
- 运行边界：{config['runtime_boundary']}

## Repo Snapshot

- 语言：{", ".join(scan['languages'])}
- 包管理器：{scan['package_manager']}
- Build Command：{scan['build_command']}
- Test Command：{scan['test_command']}
- 主要目录：{", ".join(scan['main_directories']) or "未检测到"}

## 建议下一步

1. 在 Tasks 页面输入第一个目标。
2. 用 Review 页面确认 agent 产出的实质性改动。
3. 只在需要时展开 Advanced，看规则原文和完整 diff。

{evidence}{hardening}
"""


def render_operating_rules(config: dict[str, Any], root: Path, registry: dict[str, list[dict[str, str]]] | None = None) -> str:
    evidence = render_evidence_boundary(root)
    hardening = render_canonical_hardening("docs/OPERATING_RULES.md", root, registry)
    rules = "\n".join(f"- {item}" for item in config["operating_principles"])
    return f"""# Operating Rules

## 用户需要知道的少数规则

- 系统会自动把项目说明、保护边界和 review 要求拼进 agent brief。
- 实质性改动默认先进入 Reviews，再确认落盘。
- 项目规范以 Git 中的文件为准，不依赖聊天上下文记忆。
- 当证据不足时，系统应先降级结论范围，而不是扩张判断。

## 系统自动执行的内核规则

{rules}

## 默认审批法则

- 所有 proposal 默认需要人工确认。
- 高风险变更必须保留 touched files、risk 和 diff excerpt。
- 若工作区脏、HEAD 漂移或目标 block 漂移，则拒绝 apply。

{evidence}{hardening}
"""


def render_org_model(config: dict[str, Any], root: Path, registry: dict[str, list[dict[str, str]]] | None = None) -> str:
    evidence = render_evidence_boundary(root)
    hardening = render_canonical_hardening("docs/ORG_MODEL.md", root, registry)
    sections = []
    for role in config["org_structure"]:
        sections.append(
            f"### {role['role']}\n"
            f"- Department: {role['department']}\n"
            f"- Reports To: {role['reports_to']}\n"
            f"- Responsibilities: {', '.join(role['responsibilities'])}\n"
            f"- Scope: {', '.join(role['scope'])}"
        )
    return f"""# Org Model

## 这不是给用户管理组织，而是让系统内部职责稳定

系统仍然采用虚拟公司抽象，但默认不要求小白理解全部治理术语。
这些角色存在，是为了让 agent 在任务、审查和记忆上更稳定地协作。

{chr(10).join(sections)}

{evidence}{hardening}
"""


def render_playbook(config: dict[str, Any], root: Path, registry: dict[str, list[dict[str, str]]] | None = None) -> str:
    evidence = render_evidence_boundary(root)
    fixed_report = render_fixed_report_structure(root)
    hardening = render_canonical_hardening("docs/PLAYBOOK.md", root, registry)
    return f"""# Playbook

## 核心工作流

1. Initialize: 用 5 个问题建立项目作战卡。
2. Tasks: 只输入目标、期望交付和补充说明。
3. Reviews: 先看摘要，再决定是否展开完整 diff。
4. Memory: 每次被采纳的变更进入 memory ledger。

## Task Brief Contract

- 任务目标必须明确。
- 期望交付必须可检查。
- 补充说明只写真正影响实现或验收的上下文。
- 系统会自动注入项目约束、运行边界和 review 要求。

## Report Shape

{fixed_report}

{evidence}{hardening}
"""


def render_memory_ledger(config: dict[str, Any], root: Path, registry: dict[str, list[dict[str, str]]] | None = None) -> str:
    evidence = render_evidence_boundary(root)
    hardening = render_canonical_hardening("docs/MEMORY_LEDGER.md", root, registry)
    return f"""# Memory Ledger

## 当前记忆策略

- 被采纳的 proposal 会进入 ratified notes。
- 稳定的改动会继续被收敛回 canonical content。
- 这份文档用于记录真正值得保留的项目级经验，而不是临时聊天结论。

## 当前重点

- Success Definition: {config['success_definition']}
- Current Priority: {config['current_priority']}
- Must Protect: {", ".join(config['must_protect'])}

{evidence}{hardening}
"""


def render_doc_body(
    relative_path: str,
    config: dict[str, Any],
    root: Path,
    registry: dict[str, list[dict[str, str]]] | None = None,
) -> str:
    if relative_path == "docs/PROJECT_CARD.md":
        return render_project_card(config, root, registry)
    if relative_path == "docs/OPERATING_RULES.md":
        return render_operating_rules(config, root, registry)
    if relative_path == "docs/ORG_MODEL.md":
        return render_org_model(config, root, registry)
    if relative_path == "docs/PLAYBOOK.md":
        return render_playbook(config, root, registry)
    if relative_path == "docs/MEMORY_LEDGER.md":
        return render_memory_ledger(config, root, registry)
    raise KeyError(f"No document renderer for {relative_path}")


def initial_ratified_notes(relative_path: str) -> str:
    return (
        "## Ratified Notes\n\n"
        "- 该文档当前没有额外 ratified notes。后续通过 proposal apply 增量写入。\n"
        f"- File: `{relative_path}`"
    )


def build_document_content(
    existing_text: str | None,
    relative_path: str,
    config: dict[str, Any],
    root: Path,
    registry: dict[str, list[dict[str, str]]] | None = None,
) -> tuple[str, bool]:
    canonical = render_doc_body(relative_path, config, root, registry)
    if existing_text is None:
        content = (
            build_frontmatter(relative_path, None, True)
            + wrap_managed_block("CANONICAL_CONTENT", canonical)
            + "\n\n"
            + wrap_managed_block("RATIFIED_NOTES", initial_ratified_notes(relative_path))
            + "\n\n## Manual Notes\n\n"
            + "人工补充内容写在这里。`scaffold` 只更新 managed blocks，不覆盖这一区域。\n"
        )
        return content, True
    current_canonical = extract_managed_block(existing_text, "CANONICAL_CONTENT")
    canonical_changed = current_canonical != canonical.strip()
    merged = ensure_frontmatter(existing_text, relative_path, canonical_changed)
    merged = replace_managed_block(merged, "CANONICAL_CONTENT", canonical)
    if "BEGIN MANAGED BLOCK: RATIFIED_NOTES" not in merged:
        merged = replace_managed_block(merged, "RATIFIED_NOTES", initial_ratified_notes(relative_path))
    if "## Manual Notes" not in merged:
        merged = merged.rstrip() + "\n\n## Manual Notes\n\n人工补充内容写在这里。`scaffold` 只更新 managed blocks，不覆盖这一区域。\n"
    return merged, canonical_changed


def ensure_document(
    relative_path: str,
    config: dict[str, Any],
    root: Path,
    registry: dict[str, list[dict[str, str]]] | None = None,
) -> bool:
    target = root / relative_path
    ensure_parent(target)
    existing = target.read_text(encoding="utf8") if target.exists() else None
    content, changed = build_document_content(existing, relative_path, config, root, registry)
    if existing == content:
        return False
    target.write_text(content, encoding="utf8")
    return changed


def module_scripts(config: dict[str, Any]) -> dict[str, str]:
    enabled = config["enabled_modules"]
    scripts: dict[str, str] = {}
    if enabled.get("evidence_boundary"):
        scripts["scripts/check_evidence_boundary.py"] = """#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = ["本地离线证据", "服务器真实证据", "当前结论适用边界"]

for path in (ROOT / "docs").glob("*.md"):
    text = path.read_text(encoding="utf8")
    if not all(item in text for item in REQUIRED):
        print(f"missing evidence boundary: {path.relative_to(ROOT)}")
        sys.exit(1)

print("evidence boundary check passed")
"""
    if enabled.get("server_truth_ledger"):
        scripts["scripts/server_truth_ledger.py"] = """#!/usr/bin/env python3
from pathlib import Path
import json
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "output" / "pipeline" / "state" / "server_truth_ledger" / "latest.json"
TARGET.parent.mkdir(parents=True, exist_ok=True)
TARGET.write_text(json.dumps({
    "generated_at": datetime.now(timezone.utc).isoformat(),
    "note": "Server truth ledger is enabled in advanced mode."
}, indent=2, ensure_ascii=False) + "\\n", encoding="utf8")
print(TARGET)
"""
    if enabled.get("quant_review"):
        scripts["scripts/foreman_quant_review.py"] = """#!/usr/bin/env python3
from pathlib import Path
import json
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
target = ROOT / "output" / "pipeline" / "state" / "foreman_quant_review" / "latest.json"
target.parent.mkdir(parents=True, exist_ok=True)
docs_count = len(list((ROOT / "docs").glob("*.md")))
proposal_count = len([path for path in (ROOT / "output" / "proposals").glob("*") if path.is_dir()])
target.write_text(json.dumps({
    "generated_at": datetime.now(timezone.utc).isoformat(),
    "docs_count": docs_count,
    "proposal_count": proposal_count,
    "next_focus": "Keep the core light and keep the front-end simple."
}, indent=2, ensure_ascii=False) + "\\n", encoding="utf8")
print(target)
"""
        scripts["scripts/run_foreman_quant_review.sh"] = "#!/usr/bin/env bash\nset -euo pipefail\npython3 scripts/foreman_quant_review.py\n"
        scripts["deploy/systemd/foreman-quant-review.service"] = """[Unit]
Description=Foreman Quant Review

[Service]
Type=oneshot
WorkingDirectory=%h/project
ExecStart=/usr/bin/env bash scripts/run_foreman_quant_review.sh
"""
        scripts["deploy/systemd/foreman-quant-review.timer"] = """[Unit]
Description=Run Foreman Quant Review Daily

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
"""
    return scripts


def expected_doc_paths(root: Path) -> list[str]:
    manifest = load_json(root / "bootstrap" / "templates" / "document_manifest.json")
    return manifest["core_docs"]


def expected_static_assets() -> set[str]:
    return {HARDENING_REGISTRY_PATH, RESOLVED_CONFIG_PATH}


def ensure_module_assets(config: dict[str, Any], root: Path) -> None:
    for relative_path, content in module_scripts(config).items():
        target = root / relative_path
        ensure_parent(target)
        existing = target.read_text(encoding="utf8") if target.exists() else None
        if existing != content:
            target.write_text(content, encoding="utf8")
        if relative_path.startswith("scripts/") and target.exists():
            target.chmod(0o755)
    for relative_path in [
        "output/pipeline/state/server_truth_ledger/.gitkeep",
        "output/pipeline/state/server_truth_ledger_summary/.gitkeep",
        "output/pipeline/state/foreman_quant_review/.gitkeep",
        "output/proposals/.gitkeep",
    ]:
        target = root / relative_path
        ensure_parent(target)
        if not target.exists():
            target.write_text("", encoding="utf8")
    registry_path = root / HARDENING_REGISTRY_PATH
    ensure_parent(registry_path)
    if not registry_path.exists():
        registry_path.write_text("{}\n", encoding="utf8")


def scaffold(config_path: Path, target: Path) -> None:
    brief, resolved = resolve_brief_and_config(config_path, target)
    maybe_write_brief(target, config_path, brief)
    write_resolved_config(target, resolved)
    ensure_module_assets(resolved, target)
    registry = load_hardening_registry(target)
    for relative_path in expected_doc_paths(target):
        ensure_document(relative_path, resolved, target, registry)


def projected_scaffold_changes(resolved: dict[str, Any], target: Path) -> list[str]:
    registry = load_hardening_registry(target)
    diffs: list[str] = []
    for relative_path in expected_doc_paths(target):
        path = target / relative_path
        existing = path.read_text(encoding="utf8") if path.exists() else None
        projected, _ = build_document_content(existing, relative_path, resolved, target, registry)
        if existing != projected:
            diffs.append(relative_path)
    for relative_path, content in module_scripts(resolved).items():
        path = target / relative_path
        existing = path.read_text(encoding="utf8") if path.exists() else None
        if existing != content:
            diffs.append(relative_path)
    for relative_path in expected_static_assets():
        if not (target / relative_path).exists():
            diffs.append(relative_path)
    return sorted(set(diffs))


def audit(config_path: Path, target: Path) -> AuditResult:
    brief, resolved = resolve_brief_and_config(config_path, target)
    errors: list[str] = []
    warnings: list[str] = []
    checked: list[str] = []
    missing_assets: list[str] = []
    conflicting_rules: list[str] = []
    legacy_hits: list[str] = []

    expected_docs = expected_doc_paths(target)
    for relative_path in expected_docs:
        checked.append(relative_path)
        path = target / relative_path
        if not path.exists():
            missing_assets.append(relative_path)
            errors.append(f"Missing required doc: {relative_path}")
            continue
        text = path.read_text(encoding="utf8")
        frontmatter = parse_frontmatter(text)
        missing_frontmatter = [key for key in REQUIRED_FRONTMATTER if key not in frontmatter]
        if missing_frontmatter:
            errors.append(f"{relative_path} missing frontmatter keys: {', '.join(missing_frontmatter)}")
        if "CANONICAL_CONTENT" not in text:
            errors.append(f"{relative_path} missing CANONICAL_CONTENT managed block")
        if not all(title in text for title in EVIDENCE_BOUNDARY_TITLES):
            errors.append(f"{relative_path} missing evidence boundary fields")
        for term in LEGACY_TERMS:
            if term in text:
                legacy_hits.append(f"{relative_path}: {term}")

    for relative_path, _ in module_scripts(resolved).items():
        checked.append(relative_path)
        if not (target / relative_path).exists():
            missing_assets.append(relative_path)
            errors.append(f"Missing required asset: {relative_path}")

    for relative_path in expected_static_assets():
        checked.append(relative_path)
        if not (target / relative_path).exists():
            missing_assets.append(relative_path)
            errors.append(f"Missing required asset: {relative_path}")

    churn_paths = projected_scaffold_changes(resolved, target)
    if churn_paths:
        errors.append("Scaffold would rewrite generated content unexpectedly: " + ", ".join(churn_paths[:8]))

    return AuditResult(
        passed=not errors,
        errors=errors,
        warnings=warnings,
        checked_files=checked,
        missing_assets=missing_assets,
        conflicting_rules=conflicting_rules,
        hardcoded_legacy_terms=legacy_hits,
    )


def proposal_targets(prompt: str) -> list[str]:
    lowered = prompt.lower()
    targets = ["docs/PROJECT_CARD.md"]
    if any(token in lowered for token in ["rule", "规则", "boundary", "review", "risk"]):
        targets.append("docs/OPERATING_RULES.md")
    if any(token in lowered for token in ["org", "role", "职责", "组织"]):
        targets.append("docs/ORG_MODEL.md")
    if any(token in lowered for token in ["task", "workflow", "playbook", "sop", "交付", "流程"]):
        targets.append("docs/PLAYBOOK.md")
    if any(token in lowered for token in ["memory", "ledger", "history", "decision", "记录", "沉淀"]):
        targets.append("docs/MEMORY_LEDGER.md")
    return sorted(set(targets))


def proposal_title(prompt: str) -> str:
    first_line = next((line.strip() for line in prompt.splitlines() if line.strip()), "Ratified hardening")
    return first_line[:80]


def baseline_commit_suggestion() -> str:
    return f"Suggested baseline commit: git add . && git commit -m \"{BASELINE_COMMIT_MESSAGE}\""


def git_output(target: Path, args: list[str]) -> str:
    try:
        return subprocess.run(
            ["git", *args],
            cwd=target,
            check=True,
            capture_output=True,
            text=True,
        ).stdout.strip()
    except subprocess.CalledProcessError:
        return ""


def git_has_repo(target: Path) -> bool:
    return (target / ".git").exists()


def git_head_revision(target: Path) -> str:
    if not git_has_repo(target):
        return "UNCOMMITTED"
    value = git_output(target, ["rev-parse", "HEAD"])
    return value or "UNCOMMITTED"


def git_status_porcelain(target: Path) -> list[str]:
    if not git_has_repo(target):
        return []
    output = git_output(target, ["status", "--porcelain"])
    lines = [line for line in output.splitlines() if line.strip()]
    filtered: list[str] = []
    for line in lines:
        candidate = line[3:].strip()
        if " -> " in candidate:
            candidate = candidate.split(" -> ", 1)[1]
        if any(candidate.startswith(prefix) or prefix in candidate for prefix in IGNORED_WORKTREE_PATH_PREFIXES):
            continue
        filtered.append(line)
    return filtered


def git_has_staged_changes(target: Path) -> bool:
    if not git_has_repo(target):
        return False
    output = git_output(target, ["diff", "--cached", "--name-only"])
    return bool(output.strip())


def git_has_dirty_worktree(target: Path) -> bool:
    return bool(git_status_porcelain(target))


def build_registry_entry(relative_path: str, proposal_id: str, prompt: str) -> dict[str, str]:
    return {
        "proposal_id": proposal_id,
        "title": proposal_title(prompt),
        "intent": prompt.strip(),
        "scope": DOC_META[relative_path]["title"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


def read_ratified_notes(text: str) -> str:
    match = re.search(
        r"<!-- BEGIN MANAGED BLOCK: RATIFIED_NOTES -->(.*?)<!-- END MANAGED BLOCK: RATIFIED_NOTES -->",
        text,
        re.DOTALL,
    )
    if match:
        return match.group(1).strip()
    return "## Ratified Notes\n\n- No ratified notes yet."


def append_ratified_note(existing_text: str, proposal_id: str, prompt: str) -> str:
    current = read_ratified_notes(existing_text)
    addition = (
        f"\n- [{today_iso()}] `{proposal_id}`: {prompt.strip()}\n"
        "  - status: ratified via review apply\n"
        "  - action: 如果该变化稳定，继续把它合并回 canonical content"
    )
    return replace_managed_block(existing_text, "RATIFIED_NOTES", current + addition)


def build_target_block(
    file_path: str,
    block_name: str,
    action_type: str,
    change_intent: str,
    before_content: str,
    after_content: str,
    registry_entry: dict[str, str] | None = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "file_path": file_path,
        "block_name": block_name,
        "action_type": action_type,
        "change_intent": change_intent,
        "before_content": before_content,
        "after_content": after_content,
        "before_hash": sha256_text(before_content),
        "after_hash": sha256_text(after_content),
    }
    if registry_entry is not None:
        payload["registry_entry"] = registry_entry
    return payload


def build_diff(relative_path: str, before: str, after: str) -> str:
    lines = difflib.unified_diff(
        before.splitlines(keepends=True),
        after.splitlines(keepends=True),
        fromfile=f"a/{relative_path}",
        tofile=f"b/{relative_path}",
    )
    return "".join(lines)


def materialize_candidate_files(target: Path, proposal_root: Path, target_blocks: list[dict[str, Any]]) -> str:
    files_root = proposal_root / "files"
    files_root.mkdir(parents=True, exist_ok=True)
    grouped: dict[str, list[dict[str, Any]]] = {}
    for block in target_blocks:
        grouped.setdefault(block["file_path"], []).append(block)
    diff_chunks: list[str] = []
    for relative_path, operations in grouped.items():
        current_path = target / relative_path
        before = current_path.read_text(encoding="utf8")
        after = before
        for operation in operations:
            after = replace_managed_block(after, operation["block_name"], operation["after_content"])
        candidate_path = files_root / relative_path
        candidate_path.parent.mkdir(parents=True, exist_ok=True)
        candidate_path.write_text(after, encoding="utf8")
        diff_chunks.append(build_diff(relative_path, before, after))
    return "".join(diff_chunks)


def create_proposal(config_path: Path, target: Path, prompt_file: Path) -> str:
    _, resolved = resolve_brief_and_config(config_path, target)
    prompt = prompt_file.read_text(encoding="utf8").strip()
    proposal_id = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S%f")
    proposal_root = target / "output" / "proposals" / proposal_id
    proposal_root.mkdir(parents=True, exist_ok=True)

    registry = load_hardening_registry(target)
    working_registry = json.loads(json.dumps(registry))
    target_blocks: list[dict[str, Any]] = []
    targets = proposal_targets(prompt)

    for relative_path in targets:
        current_text = (target / relative_path).read_text(encoding="utf8")
        before_content = extract_managed_block(current_text, "CANONICAL_CONTENT")
        registry_entry = build_registry_entry(relative_path, proposal_id, prompt)
        working_registry.setdefault(relative_path, []).append(registry_entry)
        preview_text, _ = build_document_content(current_text, relative_path, resolved, target, working_registry)
        after_content = extract_managed_block(preview_text, "CANONICAL_CONTENT")
        target_blocks.append(
            build_target_block(
                relative_path,
                "CANONICAL_CONTENT",
                "canonical_update",
                prompt,
                before_content,
                after_content,
                registry_entry,
            )
        )

    memory_doc = "docs/MEMORY_LEDGER.md"
    current_text = (target / memory_doc).read_text(encoding="utf8")
    before_content = extract_managed_block(current_text, "RATIFIED_NOTES")
    after_text = append_ratified_note(current_text, proposal_id, prompt)
    after_content = extract_managed_block(after_text, "RATIFIED_NOTES")
    target_blocks.append(
        build_target_block(
            memory_doc,
            "RATIFIED_NOTES",
            "ratified_note_append",
            f"Record the accepted rationale for: {prompt}",
            before_content,
            after_content,
        )
    )

    (proposal_root / "prompt.md").write_text(prompt + "\n", encoding="utf8")
    diff_text = materialize_candidate_files(target, proposal_root, target_blocks)
    (proposal_root / "diff.patch").write_text(diff_text, encoding="utf8")

    base_revision = git_head_revision(target)
    validation_summary = {
        "base_revision": base_revision,
        "git_ready": base_revision != "UNCOMMITTED",
        "dirty_worktree": git_has_dirty_worktree(target),
        "staged_changes": git_has_staged_changes(target),
        "target_block_count": len(target_blocks),
    }
    metadata = {
        "id": proposal_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "prompt": prompt,
        "affected_files": sorted({block["file_path"] for block in target_blocks}),
        "action_type": "canonical_update",
        "target_blocks": target_blocks,
        "diff_summary": f"Review summary for {len({block['file_path'] for block in target_blocks})} file(s)",
        "risk_notes": [
            "当前 proposal 引擎仍是 deterministic synthesis，但已强制在 block 级别生成和应用。",
            "如果这类改动反复出现，应把它继续下沉为默认规则，而不是长期停留在记忆层。",
        ],
        "status": "pending",
        "validation_summary": validation_summary,
        "base_revision": base_revision,
        "apply_commit_message": f"apply proposal {proposal_id}: ratify project updates",
    }
    (proposal_root / "metadata.json").write_text(json.dumps(metadata, indent=2, ensure_ascii=False), encoding="utf8")
    return proposal_id


def ensure_git_repo(target: Path) -> None:
    if not (target / ".git").exists():
        subprocess.run(["git", "init"], cwd=target, check=True, capture_output=True)


def apply_proposal(target: Path, proposal_id: str) -> None:
    proposal_root = target / "output" / "proposals" / proposal_id
    metadata_path = proposal_root / "metadata.json"
    if not metadata_path.exists():
        raise FileNotFoundError(f"Proposal {proposal_id} not found.")
    metadata = json.loads(metadata_path.read_text(encoding="utf8"))
    if metadata["status"] == "applied":
        raise ValueError(f"Proposal {proposal_id} has already been applied.")
    if git_head_revision(target) == "UNCOMMITTED":
        raise ValueError("Baseline commit required before applying proposals. " + baseline_commit_suggestion())
    if git_has_staged_changes(target):
        raise ValueError("Cannot apply proposal while staged changes exist. Commit or unstage them first.")
    if git_has_dirty_worktree(target):
        raise ValueError("Cannot apply proposal while the worktree is dirty. Commit or stash changes first.")
    if metadata["base_revision"] != git_head_revision(target):
        raise ValueError("Proposal base revision no longer matches HEAD. Regenerate the proposal.")

    for block in metadata["target_blocks"]:
        current_text = (target / block["file_path"]).read_text(encoding="utf8")
        current_block = extract_managed_block(current_text, block["block_name"])
        if sha256_text(current_block) != block["before_hash"]:
            raise ValueError(
                f"Target block drift detected for {block['file_path']}::{block['block_name']}. Regenerate the proposal."
            )

    registry = load_hardening_registry(target)
    for block in metadata["target_blocks"]:
        if block["action_type"] != "canonical_update":
            continue
        registry.setdefault(block["file_path"], [])
        if not any(item["proposal_id"] == block["registry_entry"]["proposal_id"] for item in registry[block["file_path"]]):
            registry[block["file_path"]].append(block["registry_entry"])
    save_hardening_registry(target, registry)

    config_path = target / BRIEF_PATH
    scaffold(config_path, target)

    touched_files: set[str] = {HARDENING_REGISTRY_PATH, RESOLVED_CONFIG_PATH}
    for block in metadata["target_blocks"]:
        if block["action_type"] == "ratified_note_append":
            doc_path = target / block["file_path"]
            current_text = doc_path.read_text(encoding="utf8")
            updated = replace_managed_block(current_text, block["block_name"], block["after_content"])
            doc_path.write_text(updated, encoding="utf8")
        touched_files.add(block["file_path"])

    for block in metadata["target_blocks"]:
        current_text = (target / block["file_path"]).read_text(encoding="utf8")
        current_block = extract_managed_block(current_text, block["block_name"])
        if sha256_text(current_block) != block["after_hash"]:
            raise ValueError(
                f"Applied content mismatch for {block['file_path']}::{block['block_name']}. Expected proposal output was not realized."
            )

    ensure_git_repo(target)
    for relative_path in sorted(touched_files):
        subprocess.run(["git", "add", relative_path], cwd=target, check=True, capture_output=True)

    env = os.environ.copy()
    env.setdefault("GIT_AUTHOR_NAME", "AI Operating System")
    env.setdefault("GIT_AUTHOR_EMAIL", "ai-os@local")
    env.setdefault("GIT_COMMITTER_NAME", "AI Operating System")
    env.setdefault("GIT_COMMITTER_EMAIL", "ai-os@local")
    subprocess.run(
        ["git", "commit", "-m", metadata["apply_commit_message"]],
        cwd=target,
        check=True,
        capture_output=True,
        env=env,
    )

    metadata["status"] = "applied"
    metadata["applied_at"] = datetime.now(timezone.utc).isoformat()
    metadata_path.write_text(json.dumps(metadata, indent=2, ensure_ascii=False), encoding="utf8")


def migrate_legacy_config(target: Path) -> Path:
    legacy_path = target / LEGACY_CONFIG_PATH
    if not legacy_path.exists():
        raise FileNotFoundError(f"Legacy config not found at {legacy_path}")
    brief = brief_from_legacy_config(load_yaml(legacy_path))
    brief_path = target / BRIEF_PATH
    write_yaml(brief_path, brief)
    return brief_path


def render_bootstrap_diff(before: Path, after: Path) -> str:
    before_text = before.read_text(encoding="utf8")
    after_text = after.read_text(encoding="utf8")
    return build_diff(str(before), before_text, after_text)


def print_audit_result(result: AuditResult) -> None:
    payload = {
        "passed": result.passed,
        "errors": result.errors,
        "warnings": result.warnings,
        "checked_files": result.checked_files,
        "missing_assets": result.missing_assets,
        "conflicting_rules": result.conflicting_rules,
        "hardcoded_legacy_terms": result.hardcoded_legacy_terms,
    }
    print(json.dumps(payload, indent=2, ensure_ascii=False))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Compounding bootstrap kit CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    scaffold_parser = subparsers.add_parser("scaffold")
    scaffold_parser.add_argument("--config", required=True)
    scaffold_parser.add_argument("--target", required=True)

    audit_parser = subparsers.add_parser("audit")
    audit_parser.add_argument("--config", required=True)
    audit_parser.add_argument("--target", required=True)

    propose_parser = subparsers.add_parser("propose")
    propose_parser.add_argument("--config", required=True)
    propose_parser.add_argument("--target", required=True)
    propose_parser.add_argument("--prompt-file", required=True)

    apply_parser = subparsers.add_parser("apply-proposal")
    apply_parser.add_argument("--proposal", required=True)
    apply_parser.add_argument("--target", required=True)

    validate_parser = subparsers.add_parser("validate-config")
    validate_parser.add_argument("--config", required=True)
    validate_parser.add_argument("--target", required=True)

    migrate_parser = subparsers.add_parser("migrate-legacy-config")
    migrate_parser.add_argument("--target", required=True)

    return parser


def resolve_input_path(target: Path, candidate: str) -> Path:
    path = Path(candidate)
    if path.is_absolute():
        return path
    return target / path


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.command == "scaffold":
        target = Path(args.target).resolve()
        scaffold(resolve_input_path(target, args.config), target)
        print("scaffold complete")
        return 0

    if args.command == "audit":
        target = Path(args.target).resolve()
        result = audit(resolve_input_path(target, args.config), target)
        print_audit_result(result)
        return 0 if result.passed else 1

    if args.command == "propose":
        target = Path(args.target).resolve()
        proposal_id = create_proposal(
            resolve_input_path(target, args.config),
            target,
            resolve_input_path(target, args.prompt_file),
        )
        print(proposal_id)
        return 0

    if args.command == "apply-proposal":
        target = Path(args.target).resolve()
        apply_proposal(target, args.proposal)
        print("proposal applied")
        return 0

    if args.command == "validate-config":
        target = Path(args.target).resolve()
        print(json.dumps(validate_config_file(resolve_input_path(target, args.config), target), indent=2, ensure_ascii=False))
        return 0

    if args.command == "migrate-legacy-config":
        target = Path(args.target).resolve()
        print(str(migrate_legacy_config(target).relative_to(target)))
        return 0

    parser.error("Unknown command.")
    return 1
