---
name: planning-before-coding
description: Hard-gate workflow - no implementation before design approval. Use when starting any feature work, modification, or creative task.
origin: superpowers
applicable_to: [claude-code, cursor, windsurf, codex, opencode, generic]
---

# Planning Before Coding

## The Iron Law

```
NO CODE WITHOUT DESIGN APPROVAL FIRST
```

**Core principle:** "Simple" projects are where unexamined assumptions cause the most wasted work.

## When to Activate

- Starting any feature implementation
- Modifying existing functionality
- Creative/architecture decisions
- Any task where "I'll figure it out as I go" seems tempting

## Process

### 1. Explore Context
- Check existing files, docs, patterns
- Read related code
- Understand the codebase conventions

### 2. Ask Questions
- One at a time
- Understand purpose and success criteria
- Clarify ambiguities before assuming

### 3. Propose Approaches
- 2-3 options with tradeoffs
- State your recommendation
- Explain why you recommend this approach

### 4. Present Design
- In digestible sections
- Get approval after each section
- Do NOT proceed until design is approved

### 5. Write Spec Doc
- Save to `docs/specs/YYYY-MM-DD-<topic>.md`
- Include: Overview, Approach, Data Model, API, Edge Cases

### 6. Self-Review
- Check for placeholders
- Look for contradictions
- Verify scope is clear

### 7. User Approves
- Explicit sign-off required
- Not implied by silence

## Anti-Patterns

| Rationalization | Reality |
|-----------------|---------|
| "This is too simple to need a design" | Simple projects have the biggest wasted work |
| "I'll design as I go" | Undisciplined = rework |
| "I know what they want" | Assumptions cause waste |
| "We'll refactor later" | Technical debt compounds |

## Red Flags

These mean **STOP** and start design:
- Writing code before approved design
- "Let me explore first" without design doc
- Skipping user approval
- Starting implementation based on assumptions

## Next Steps

After approved design → Use `tdd-workflow` for implementation.

---

*Extracted from superpowers - https://github.com/obra/superpowers*
