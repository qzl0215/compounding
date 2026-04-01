# OpenSpec adoption design

## Structure

- `openspec/project.md` explains how OpenSpec is used in this repo.
- `openspec/specs/<capability>/spec.md` stores stable specs.
- `openspec/changes/<slug>/proposal.md` captures intent.
- `openspec/changes/<slug>/design.md` captures implementation shape.
- `openspec/changes/<slug>/tasks.md` captures the execution checklist.
- `openspec/changes/<slug>/specs/` stores the delta or initial spec material for the change.

## Pilot capability

- First-class repo-governance rules for OpenSpec usage.
- One product-facing pilot family on the shared control plane path:
  - `orchestration`
  - `harness`

## Validation

- A dedicated validator checks that the project doc, stable specs, change package, and task binding are consistent.
- Existing task and release gates remain unchanged.

## Boundary

- OpenSpec packages describe capability state and deltas.
- OpenSpec packages do not replace the plan source or task execution contract.
