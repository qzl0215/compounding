# Repo Governance Spec

This capability defines how OpenSpec is used in Compounding.

## Invariants

- `AGENTS.md`, `memory/project/operating-blueprint.md`, and `tasks/queue/*` remain authoritative.
- `openspec/specs/` holds stable capability specs.
- `openspec/changes/` holds proposals, designs, tasks, and deltas.
- One change package maps to one task binding.
- `openspec/changes/archive/` is archive-only.

## Acceptance

- OpenSpec files are discoverable from a single `openspec/project.md` entry point.
- Capability specs stay separate from transient change packages.
- The repository can validate OpenSpec consistency without replacing the task state machine.
