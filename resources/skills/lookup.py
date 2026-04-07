#!/usr/bin/env python3
"""
Skill Lookup - 根据上下文匹配激活的Skills
考虑订阅状态：subscribed正常调用，paused降级为manual，unsubscribed不返回
"""
import json
import argparse
from pathlib import Path
from typing import List, Dict, Any

# 路径配置
INDEX_FILE = Path(__file__).parent / "skill-index.json"
SUBSCRIPTIONS_FILE = Path(__file__).parent.parent.parent / "memory/skills/subscriptions.json"


def load_data() -> tuple:
    """加载索引和订阅数据"""
    with open(INDEX_FILE) as f:
        index_data = json.load(f)
    with open(SUBSCRIPTIONS_FILE) as f:
        subscriptions = json.load(f)
    return index_data, subscriptions


def matches_condition(cond: dict, context: str, failure_count: int) -> bool:
    """检查条件是否匹配"""
    ctype = cond.get("type")
    if ctype == "file_match":
        return cond.get("pattern", "") in context
    if ctype == "failure_count":
        return failure_count >= cond.get("min", 2)
    if ctype == "pattern":
        return any(p.lower() in context.lower() for p in cond.get("patterns", []))
    return False


def lookup(context: str = "", failure_count: int = 0, phase: str = None,
           subscribed_only: bool = False) -> List[Dict[str, Any]]:
    """
    根据上下文、条件和订阅状态查找匹配的Skills

    Args:
        context: 当前上下文描述
        failure_count: 失败次数
        phase: 当前阶段 (planning/executing/review/release)
        subscribed_only: 只返回订阅的Skills
    """
    index_data, subscriptions = load_data()

    matched = []
    context_lower = context.lower()

    for skill in index_data["index"]:
        skill_id = skill["id"]
        sub = subscriptions.get("skills", {}).get(skill_id, {})
        status = sub.get("status", "paused")

        # unsubscribed: 完全不返回
        if status == "unsubscribed":
            continue

        # paused: 降级为manual，不在自动上下文中（除非显式请求subscribed_only）
        if status == "paused" and not subscribed_only:
            continue

        mode = skill.get("invoke_mode", "advisory")

        # inline: 总是匹配
        if mode == "inline":
            matched.append({
                "skill": skill,
                "mode": "inline",
                "reasons": ["always"],
                "status": status
            })
            continue

        # mandatory: force_when条件匹配
        if mode == "mandatory":
            for cond in skill.get("force_when", []):
                if matches_condition(cond, context_lower, failure_count):
                    matched.append({
                        "skill": skill,
                        "mode": "mandatory",
                        "reasons": [f"force:{cond['type']}"],
                        "status": status
                    })
                    break
            continue

        # advisory/manual: 模式匹配 + 阶段匹配
        score = 0
        reasons = []

        for pattern in skill.get("trigger_patterns", []):
            if pattern.lower() in context_lower:
                score += 1
                reasons.append(f"pattern:{pattern}")

        if skill.get("special_phase") == phase:
            score += 5
            reasons.append(f"phase:{phase}")

        if score > 0:
            matched.append({
                "skill": skill,
                "mode": mode,
                "score": score,
                "reasons": reasons,
                "status": status
            })

    # 排序：inline/mandatory优先，然后按score排序advisory
    advisory = sorted([m for m in matched if m["mode"] == "advisory"],
                     key=lambda x: x.get("score", 0), reverse=True)
    result = [m for m in matched if m["mode"] in ["inline", "mandatory"]]
    result.extend(advisory)

    return result


def format_output(matches: List[Dict[str, Any]], verbose: bool = False) -> str:
    """格式化输出"""
    if not matches:
        return "No skills matched."

    lines = []
    for m in matches:
        skill = m["skill"]
        mode = m["mode"]
        status = m.get("status", "unknown")

        if verbose:
            lines.append(f"## {skill['name']} [{mode}] [{status}]")
            lines.append(f"   {skill['description']}")
            lines.append(f"   Reasons: {', '.join(m.get('reasons', []))}")
            lines.append("")
        else:
            score_info = f" (score={m.get('score', 0)})" if "score" in m else ""
            lines.append(f"- [{status}] {skill['name']} [{mode}]{score_info}")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Skill Lookup Tool")
    parser.add_argument("--context", "-c", default="",
                       help="当前上下文描述")
    parser.add_argument("--failure-count", "-f", type=int, default=0,
                       help="失败次数")
    parser.add_argument("--phase", "-p", choices=["planning", "executing", "review", "release"],
                       help="当前阶段")
    parser.add_argument("--subscribed-only", "-s", action="store_true",
                       help="包含paused状态的skills")
    parser.add_argument("--verbose", "-v", action="store_true",
                       help="详细输出")

    args = parser.parse_args()

    matches = lookup(
        context=args.context,
        failure_count=args.failure_count,
        phase=args.phase,
        subscribed_only=args.subscribed_only
    )

    print(format_output(matches, verbose=args.verbose))


if __name__ == "__main__":
    main()
