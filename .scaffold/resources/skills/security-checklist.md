---
name: security-review-checklist
description: Comprehensive security checklist covering OWASP Top 10, authentication, input validation, and deployment verification. Extracted from ECC.
origin: everything-claude-code
applicable_to: [claude-code, cursor, windsurf, codex, opencode, generic]
---

# Security Review Checklist

## When to Activate

- Implementing authentication/authorization
- Handling user input or file uploads
- Creating API endpoints
- Working with secrets/credentials
- Implementing payment features
- Any code that handles sensitive data

## Pre-Commit Security Checklist

### Secrets Management

- [ ] No hardcoded API keys, passwords, tokens, or private keys in code
- [ ] All secrets loaded from environment variables
- [ ] `.env.local` / `.env.*.local` in `.gitignore`
- [ ] No secrets in logs, error messages, or stack traces
- [ ] `.env.example` committed with placeholder values only

### Input Validation

- [ ] All user inputs validated with schema (e.g., Zod, Joi, Yup)
- [ ] File uploads restricted by size, type, and extension
- [ ] No direct user input in SQL queries, shell commands, or file paths
- [ ] HTML/user content sanitized before rendering

### SQL Injection Prevention

- [ ] Parameterized queries only (no string concatenation)
- [ ] ORM used for complex queries
- [ ] Database user has minimal required privileges

### XSS Prevention

- [ ] User HTML sanitized (DOMPurify, bleach)
- [ ] Content Security Policy (CSP) headers configured
- [ ] No `dangerouslySetInnerHTML` without explicit sanitization
- [ ] Output encoding appropriate for context (HTML, JS, URL)

### Authentication/Authorization

- [ ] Tokens stored in `httpOnly` cookies (NOT `localStorage`)
- [ ] Authorization checks before every sensitive operation
- [ ] Row Level Security (RLS) enabled for databases
- [ ] Session expires appropriately
- [ ] Password hashed with strong algorithm (bcrypt, argon2)
- [ ] MFA available for sensitive operations

### Rate Limiting

- [ ] Rate limiting on ALL API endpoints
- [ ] Stricter limits on expensive operations (file uploads, complex queries)
- [ ] Login endpoints protected against brute force

### Sensitive Data

- [ ] Error messages don't expose internal details
- [ ] Stack traces not exposed to end users
- [ ] Credit card/PII data never logged
- [ ] Data encrypted at rest and in transit

### Dependencies

- [ ] `npm audit` / `pip audit` shows no critical vulnerabilities
- [ ] Dependencies regularly updated
- [ ] Dependabot or similar automated updates enabled
- [ ] No transitive dependencies on untrusted packages

## Deployment Gate

These must pass before any deployment:

- [ ] HTTPS enforced on all traffic
- [ ] Security headers configured (HSTS, X-Frame-Options, etc.)
- [ ] Dependencies audit passes
- [ ] No debug mode in production
- [ ] Proper CORS configuration
- [ ] Database credentials rotated from development

## OWASP Top 10 Coverage

| OWASP Category | Checkpoints |
|----------------|------------|
| A01: Broken Access Control | [ ] AuthZ checks, [ ] RLS, [ ] IDOR prevention |
| A02: Cryptographic Failures | [ ] No hardcoded secrets, [ ] HTTPS, [ ] proper hashing |
| A03: Injection | [ ] Parameterized queries, [ ] input validation, [ ] sanitization |
| A04: Insecure Design | [ ] Threat modeling, [ ] secure defaults |
| A05: Security Misconfiguration | [ ] Hardened configs, [ ] minimal surface |
| A06: Vulnerable Components | [ ] Audit, [ ] updates, [ ] no unused deps |
| A07: Auth Failures | [ ] httpOnly cookies, [ ] MFA, [ ] session expiry |
| A08: Data Integrity Failures | [ ] CSRF tokens, [ ] file integrity checks |
| A09: Logging Failures | [ ] Audit logs, [ ] no secrets in logs |
| A10: SSRF | [ ] URL validation, [ ] allowlist for fetches |

---

*Extracted from everything-claude-code (ECC) - https://github.com/affaan-m/everything-claude-code*
