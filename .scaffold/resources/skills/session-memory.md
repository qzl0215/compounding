---
name: session-memory
description: Extract and persist patterns from sessions for future use. Lightweight version inspired by claude-mem continuous learning concept.
origin: claude-mem
applicable_to: [claude-code, cursor, windsurf, codex, opencode, generic]
---

# Session Memory Pattern

## When to Activate

- Session ending
- After solving a non-obvious problem
- When user corrects your approach
- Discovering a workaround

## Core Concept

**Every session contains learnable patterns.** Extract them for future sessions.

## Pattern Types

| Type | Description | Example |
|------|-------------|---------|
| `error_resolution` | How a specific error was solved | "MongoDB timeout → increase pool size" |
| `user_preference` | User's preferred way | "User prefers error messages in Chinese" |
| `workaround` | Non-obvious solution | "API rate limit → exponential backoff with jitter" |
| `project_convention` | Project-specific pattern | "Auth tokens expire every 1 hour in staging" |

## Extraction Process

### Step 1: Review Session

Look for:
- Repeated errors and their solutions
- User corrections
- Non-obvious workarounds discovered
- Project conventions

### Step 2: Structure the Pattern

```markdown
## Pattern: [Brief Title]
**Type:** error_resolution
**Context:** [When does this apply?]
**Solution:** [What worked]
**Why:** [Why this works]
```

### Step 3: Choose Storage

| Pattern Scope | Storage |
|--------------|---------|
| Cross-project | `~/.agent/memory/` (global) |
| Project-specific | `project/.agent/memory/` (local) |

### Step 4: Save with Quality Gate

Before saving, verify:
- [ ] Specific enough to be actionable
- [ ] Includes context (when to apply)
- [ ] Not already in memory directory
- [ ] Has outcome (what happens when applied)

## Example

### Before (session excerpt)
```
User: The export keeps timing out
Agent: Increased timeout to 30s
User: No, it needs to stream
Agent: Refactored to streaming. Works now.
```

### After (saved pattern)
```markdown
## Pattern: Large Export Timeout
**Type:** error_resolution
**Context:** API exports timing out with large datasets (>10MB)
**Solution:** Refactor to streaming responses with chunked transfer
**Why:** Buffering entire response causes memory issues + timeout
**Prevention:** Add streaming for any export > 5MB
```

## Privacy

Use `<private>` tags for sensitive content:
```markdown
<private>
User's API keys, passwords, personal data
</private>
```

## Tool Support

```python
# Pseudocode for session-end extraction
def on_session_end(transcript):
    patterns = extract_patterns(transcript)
    for p in patterns:
        if is_reusable(p) and not exists(p):
            save(p)
```

## Anti-Patterns

- ❌ Saving obvious patterns (use common sense)
- ❌ Saving without context (useless)
- ❌ Saving duplicates (check first)
- ❌ Saving vague patterns (must be actionable)

---

*Inspired by claude-mem - https://github.com/thedotmack/claude-mem*
