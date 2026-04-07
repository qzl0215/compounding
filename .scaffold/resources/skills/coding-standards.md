---
name: coding-standards-immutability
description: Immutability-first coding style with file organization, error handling, and code quality guidelines. Extracted from ECC.
origin: everything-claude-code
applicable_to: [claude-code, cursor, windsurf, codex, opencode, generic]
---

# Coding Standards: Immutability & Style

## CRITICAL: Immutability First

**ALWAYS create new objects, NEVER mutate existing ones.**

```typescript
// ❌ WRONG - mutates original
function updateUser(user, name) {
  user.name = name
  return user
}

// ✅ CORRECT - returns new copy
function updateUser(user, name) {
  return { ...user, name }
}
```

```python
# ❌ WRONG - mutates original
def add_item(items, item):
    items.append(item)
    return items

# ✅ CORRECT - returns new list
def add_item(items, item):
    return [*items, item]
```

```go
// ❌ WRONG - mutates original
func updateUser(user *User, name string) {
    user.Name = name
}

// ✅ CORRECT - returns new copy
func updateUser(user User, name string) User {
    user.Name = name
    return user
}
```

### Why Immutability?

1. **Predictability** - No hidden side effects
2. **Debuggability** - State changes are explicit and traceable
3. **Concurrency** - Safe to share across threads
4. **Undo/Redo** - Easy to maintain history

## File Organization

| Rule | Reason |
|------|--------|
| **200-400 lines per file** | Easier to understand, review, and navigate |
| **800 lines absolute max** | Beyond this, split immediately |
| **Organize by feature/domain** | NOT by type (controllers/, models/, utils/) |
| **High cohesion** | Related things live together |
| **Low coupling** | Minimal dependencies between files |

### Directory Structure Example

```
src/
├── features/
│   ├── auth/
│   │   ├── login.ts
│   │   ├── logout.ts
│   │   ├── auth.test.ts
│   │   └── auth.schema.ts
│   ├── payments/
│   │   ├── charge.ts
│   │   ├── refund.ts
│   │   └── payments.test.ts
│   └── users/
│       ├── profile.ts
│       ├── settings.ts
│       └── users.test.ts
├── shared/
│   ├── validation.ts
│   ├── errors.ts
│   └── types.ts
└── app.ts
```

## Error Handling

| Rule | Example |
|------|---------|
| **Handle errors at EVERY layer** | Don't let errors silently propagate |
| **Never silently swallow errors** | At minimum, log them |
| **User-friendly messages in UI** | "Something went wrong" not stack trace |
| **Detailed context logged server-side** | Include request ID, user ID, etc. |

```typescript
// ❌ BAD - silent failure
try {
  await saveToDatabase(data)
} catch (e) {
  // nothing
}

// ✅ GOOD - explicit handling
try {
  await saveToDatabase(data)
} catch (error) {
  logger.error('Failed to save', { error, data, userId })
  throw new UserFriendlyError('Failed to save your changes. Please try again.')
}
```

## Input Validation

- **Validate at system boundaries** - Trust nothing from external sources
- **Use schema-based validation** - Zod, Joi, Yup, pydantic
- **Fail fast with clear messages** - Don't pass invalid data deep into the system

```typescript
// ✅ Always validate at the boundary
async function handleCreateUser(request: Request) {
  const result = userSchema.safeParse(request.body)
  if (!result.success) {
    return Response.json({ error: result.error.format() }, { status: 400 })
  }
  // Now we know result.data is safe
  await createUser(result.data)
}
```

## Code Quality Checklist

- [ ] Functions < 50 lines (if longer, consider splitting)
- [ ] Files < 800 lines (hard limit)
- [ ] No deep nesting > 4 levels
- [ ] Proper error handling on every boundary
- [ ] No hardcoded values (use constants/config)
- [ ] Immutability used throughout
- [ ] No commented-out code
- [ ] Descriptive variable/function names

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `userName`, `isActive` |
| Functions | camelCase | `getUser()`, `calculateTotal()` |
| Classes | PascalCase | `UserService`, `PaymentProcessor` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES`, `API_BASE_URL` |
| Files | kebab-case | `user-service.ts`, `auth-utils.ts` |
| React Components | PascalCase | `UserProfile.tsx` |

## Anti-Patterns

- ❌ Mutating function parameters
- ❌ 1000+ line "god files"
- ❌ Catching errors without handling
- ❌ Deeply nested callbacks/conditionals
- ❌ Magic numbers/strings without constants
- ❌ Type `any` without reason

---

*Extracted from everything-claude-code (ECC) - https://github.com/affaan-m/everything-claude-code*
