# Harness Spec

This capability defines the single control plane runtime snapshot.

## Purpose

- Hold the live intent, contract, workflow state, hygiene state, runtime alignment, next action, and compatibility facts.
- Make the next legal action explicit rather than inferred separately in each consumer.

## Objects

- `Intent`
- `Contract`
- `State`
- `Action`
- `Artifact`
- `RuntimeFact`
- `Event`

## Invariants

- Harness has one live snapshot and one canonical event stream.
- Workflow state, hygiene, and runtime alignment are separate signals.
- Consumers read the snapshot; they do not recalculate control-plane truth independently.
- UI layers must not become write paths.

## Acceptance

- The CLI and Studio can read the same harness snapshot.
- The next action is unique and explainable.
- Hygiene blockers and runtime drift remain visible instead of being folded into a generic blocked state.
