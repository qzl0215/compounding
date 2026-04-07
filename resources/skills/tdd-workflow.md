---
name: tdd-workflow
description: Test-driven development with RED-GREEN-REFACTOR cycle, 80%+ coverage requirement, and three test types (unit, integration, E2E). Extracted from ECC.
origin: everything-claude-code
applicable_to: [claude-code, cursor, windsurf, codex, opencode, generic]
---

# Test-Driven Development Workflow

## When to Activate

- Writing new features
- Fixing bugs
- Refactoring code
- Any code change that can be tested

## Core Principle: Tests BEFORE Code

### RED Phase - Write Failing Test First

1. Write test for the behavior you want
2. Run test - verify it **FAILS** (this proves the test works)
3. Commit message: `test: add reproducer for <feature>`

### GREEN Phase - Minimal Implementation

1. Write **minimum** code to make test pass
2. Run test - verify it **PASSES**
3. Commit message: `fix: implement <feature>`

### REFACTOR Phase - Improve

1. Improve code quality while keeping tests green
2. Verify coverage: **80%+** required
3. Commit message: `refactor: clean up after <feature>`

## Three Test Types Required

| Type | Scope | Examples |
|------|-------|----------|
| **Unit Tests** | Functions, utilities, components | Pure functions, validators, transformers |
| **Integration Tests** | API endpoints, DB operations | REST APIs, database queries, file I/O |
| **E2E Tests** | Critical user flows | Playwright/Cypress for login, checkout, etc. |

## Coverage Requirements

```
Minimum: 80%
Critical code (auth, payments, business logic): 100%
```

## Git Checkpoint Protocol

- Create checkpoint commit **after each TDD phase**
- Do NOT squash until workflow complete
- This creates a reversible history of your implementation

## Anti-Patterns

- ❌ Writing code BEFORE tests
- ❌ Writing tests that don't fail first
- ❌ Skipping coverage requirements
- ❌ "I'll test later" mentality

## Usage Example

```
Task: Implement user login

1. Write test: expect(validCredentials).toAuthenticate()
   → FAILS (no implementation)

2. Write minimal auth code
   → PASSES

3. Refactor: extract to service, add error handling
   → Still PASSES, coverage 85%

4. E2E test: user can login and see dashboard
   → PASSES
```

---

*Extracted from everything-claude-code (ECC) - https://github.com/affaan-m/everything-claude-code*
