---
name: systematic-debugging
description: 5-step systematic debugging methodology. Use when encountering errors, bugs, or unexpected behavior that isn't immediately obvious.
origin: superpowers
applicable_to: [claude-code, cursor, windsurf, codex, opencode, generic]
---

# Systematic Debugging

## When to Activate

- Any error that isn't immediately obvious
- Bug that has resisted initial attempts
- Third attempt at the same problem
- Error message you don't understand

## The 5-Step Method

### Step 1:闻味道 (Smell the Problem)

**What:** List all attempts you've made. Find the common failure pattern.

```
Attempts made:
1. Restarted the server → Same error
2. Cleared cache → Same error
3. Updated dependencies → Same error

Pattern: Error persists across different environments
→ Problem is likely in configuration or data, not code
```

### Step 2: 揪头发 (Pull Your Hair)

**What:** Go deep on the error itself.

1. Read error message word by word
2. Search for the exact error string
3. Read source code at the failure point
4. Validate each assumption you're making
5. Try the opposite assumption

```
Example:
Assumption: "The API is returning wrong data"
Opposite: "The API is correct, our parsing is wrong"

Validate: Log the raw API response, compare to what we parse
```

### Step 3: 照镜子 (Look in the Mirror)

**What:** Check your own process.

- Is this a repeated mistake? (Should have caught this earlier?)
- Did I skip a step?
- Is there a simpler thing I didn't try?
- Am I missing something obvious?

### Step 4: 执行 (Execute)

**What:** Implement with verification standard.

- Solution must be fundamentally different (not just tweaking parameters)
- Have a clear "this proves it worked" criterion
- Document what you changed and why

### Step 5: 复盘 (Review)

**What:** After fixing, prevent recurrence.

- Check for similar issues elsewhere
- Add tests that would have caught this
- Document the root cause

## Before Saying "Cannot Solve"

You MUST complete these checks:

- [ ] Read error message word by word
- [ ] Searched for exact error string
- [ ] Read source code at failure point
- [ ] Validated all assumptions with tools
- [ ] Tried opposite assumption
- [ ] Attempted fundamentally different solution
- [ ] Can reproduce in minimal scope

**If you skip these → You cannot say "cannot solve".**

## Anti-Patterns

| Bad | Better |
|-----|--------|
| Restart everything | Diagnose first |
| Try random changes | Hypothesis → test |
| Ignore error messages | Read every word |
| Assume it's a library bug | Assume it's your code first |
| Fix and move on | Fix + prevent recurrence |

---

*Extracted from superpowers - https://github.com/obra/superpowers*
