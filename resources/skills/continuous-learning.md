---
name: continuous-learning
description: Extract reusable patterns from sessions and persist them for future use. Extracted from ECC.
origin: everything-claude-code
applicable_to: [claude-code, cursor, windsurf, codex, opencode, generic]
---

# Continuous Learning Pattern

## When to Activate

- Session ending
- After solving a complex problem
- When discovering a new workaround
- When user corrects your approach

## Core Concept

**Every session contains learnable patterns.** The goal is to extract them so future sessions benefit.

## Pattern Types

| Type | Description | Example |
|------|-------------|---------|
| `error_resolution` | How a specific error was solved | "MongoDB timeout → increase pool size" |
| `user_corrections` | User's preferred way of doing things | "User prefers error messages in Chinese" |
| `workarounds` | Non-obvious solutions | "API rate limit → exponential backoff with jitter" |
| `debugging_techniques` | Systematic debugging approaches | "Network issues → check proxy settings first" |
| `project_specific` | Conventions unique to this project | "Auth tokens expire every 1 hour in staging" |

## Extraction Process

### Step 1: Review Session Transcript

Look for:
- Repeated errors and their solutions
- User corrections and preferences
- Non-obvious workarounds discovered
- Project-specific conventions

### Step 2: Categorize Pattern

```markdown
Type: error_resolution
Context: API integration
Pattern: When encountering 429 rate limit, implement exponential backoff starting at 1s, doubling up to 60s max
Why: Direct retries would compound the problem
```

### Step 3: Decide Storage

| Pattern Type | Storage Location |
|--------------|------------------|
| Cross-project patterns | `~/.agent/skills/` (global) |
| Project-specific patterns | `project/.agent/skills/` (local) |

### Step 4: Save with Quality Gate

Before saving, verify:
- [ ] Pattern is **specific** enough to be actionable
- [ ] Pattern is **not** already in skills directory
- [ ] Pattern has **context** (when to apply)
- [ ] Pattern has **outcome** (what happens when applied)

## Example Pattern Extraction

### Before (session transcript excerpt)

```
User: The export feature keeps timing out
Agent: I increased the timeout to 30s
User: No, it needs to stream the response instead
Agent: I refactored to use streaming. Now it works.
```

### After (extracted pattern)

```markdown
---
name: export-streaming-pattern
type: error_resolution
origin_session: 2024-03-15-export-issue
---

## Context
Large data exports (>10MB) were timing out with default timeout.

## Pattern
When export endpoints timeout, refactor to streaming responses
instead of buffering entire response in memory.

## Implementation
- Use streaming for file downloads > 5MB
- Set `Transfer-Encoding: chunked`
- Avoid loading entire dataset into memory
```

## Anti-Patterns

- ❌ Saving obvious patterns (use common sense)
- ❌ Saving duplicate patterns (check before saving)
- ❌ Saving vague patterns (must be actionable)
- ❌ Saving without context (useless without it)

## Tool Support

This pattern can be automated with session hooks:

```python
# Pseudocode for session-end extraction
def on_session_end(transcript):
    patterns = extract_patterns(transcript)
    for p in patterns:
        if is_reusable(p) and not exists(p):
            save(p)
```

## Quality Gate Checklist

- [ ] Is this pattern specific?
- [ ] Does it include context?
- [ ] Is it not already in skills?
- [ ] Will I remember this without the transcript?

If all YES → Save
If any NO → Discard or improve

---

*Extracted from everything-claude-code (ECC) - https://github.com/affaan-m/everything-claude-code*
