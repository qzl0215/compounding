from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path


@dataclass
class ProposalGeneration:
    content: str
    provider: str
    model: str
    fallback_reason: str | None = None


def generate_proposal_block(*, relative_path: str, current_block: str, prompt: str, fallback) -> ProposalGeneration:
    provider_config = resolve_provider_config()
    api_key = provider_config["api_key"]
    model = provider_config["model"]
    if not api_key or not model:
        return ProposalGeneration(
            content=fallback(current_block, relative_path, prompt),
            provider="deterministic-fallback",
            model="heuristic-rules",
            fallback_reason="ARK/OpenAI model credentials are not configured in env or .env files.",
        )

    try:
        generated = call_openai_model(
            api_key=api_key,
            model=model,
            base_url=provider_config["base_url"],
            relative_path=relative_path,
            current_block=current_block,
            prompt=prompt,
        )
    except (OSError, urllib.error.URLError, urllib.error.HTTPError, ValueError) as error:
        return ProposalGeneration(
            content=fallback(current_block, relative_path, prompt),
            provider="deterministic-fallback",
            model="heuristic-rules",
            fallback_reason=str(error),
        )

    return ProposalGeneration(content=normalize_generated_block(generated), provider=provider_config["provider"], model=model)


def call_openai_model(*, api_key: str, model: str, base_url: str, relative_path: str, current_block: str, prompt: str) -> str:
    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You rewrite a single managed Markdown block for an AI-native repo. "
                    "Return only the revised block body in Markdown. "
                    "Do not include code fences, frontmatter, or block markers."
                ),
            },
            {
                "role": "user",
                "content": f"Target file: {relative_path}\n\nUser intent:\n{prompt}\n\nCurrent block:\n{current_block}\n",
            },
        ],
    }
    request = urllib.request.Request(
        completion_endpoint(base_url),
        data=json.dumps(payload).encode("utf8"),
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        data = json.loads(response.read().decode("utf8"))
    choices = data.get("choices") or []
    if not choices:
        raise ValueError("Model returned no choices.")
    message = choices[0].get("message", {})
    content = message.get("content")
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "\n".join(item.get("text", "") for item in content if item.get("type") == "text")
    raise ValueError("Unsupported model response shape.")


def normalize_generated_block(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```") and "\n" in cleaned:
        cleaned = cleaned.split("\n", 1)[1]
    if cleaned.endswith("```"):
        cleaned = cleaned[: -len("```")]
    return cleaned.strip() + "\n"


def resolve_provider_config() -> dict[str, str | None]:
    file_env = load_repo_env()
    api_key = read_env_value(file_env, "ARK_API_KEY", "OPENAI_API_KEY")
    model = read_env_value(file_env, "ARK_MODEL", "OPENAI_MODEL")
    base_url = read_env_value(file_env, "ARK_BASE_URL", "OPENAI_BASE_URL")

    if api_key and model:
        if os.getenv("ARK_API_KEY") or file_env.get("ARK_API_KEY") or os.getenv("ARK_MODEL") or file_env.get("ARK_MODEL"):
            provider = "ark-openai-compatible"
            base_url = base_url or "https://ark.cn-beijing.volces.com/api/v3"
        else:
            provider = "openai-compatible"
            base_url = base_url or "https://api.openai.com/v1"
    else:
        provider = "deterministic-fallback"

    return {
        "api_key": api_key,
        "model": model,
        "base_url": base_url,
        "provider": provider,
    }


def load_repo_env() -> dict[str, str]:
    root = Path(__file__).resolve().parents[2]
    payload: dict[str, str] = {}
    for name in (".env.local", ".env"):
        path = root / name
        if not path.exists():
            continue
        for raw in path.read_text(encoding="utf8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            payload[key.strip()] = strip_quotes(value.strip())
    return payload


def strip_quotes(value: str) -> str:
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
        return value[1:-1]
    return value


def read_env_value(file_env: dict[str, str], *keys: str) -> str | None:
    for key in keys:
        if os.getenv(key):
            return os.getenv(key)
    for key in keys:
        if file_env.get(key):
            return file_env[key]
    return None


def completion_endpoint(base_url: str) -> str:
    normalized = base_url.rstrip("/")
    if normalized.endswith("/chat/completions"):
        return normalized
    return f"{normalized}/chat/completions"
