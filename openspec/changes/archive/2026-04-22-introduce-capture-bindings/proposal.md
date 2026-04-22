## Why

Each exporter owns a giant per-block `switch` that hand-writes shell commands: `bash.ts` has `generateEnvVersionBlock`, `generateCloudBlock`, `generateGitBranchBlock`, `generateGitStatusBlock`, etc., and `powershell.ts` carries a parallel set. Adding a block requires a new case in every target; adding a target (M3: Starship, Oh My Posh) requires re-authoring commands for every block. Shell knowledge is currently scattered across logic files that have no business knowing how git branches are fetched.

Phase 2 of the exporter/renderer unification refactor. Moves the data (shell commands, variable names, guards) from exporter switches onto block definitions, so exporters become generic walkers that format bindings instead of authoring them. Depends on phase 1 (`refactor-shared-color-utils`).

## What Changes

- Extend `BlockDefinition` with a `captures: Record<string, CaptureDefinition>` field. Each capture represents a single piece of data a block needs (e.g. `branch`, `dirty`, `ahead`, `behind` for `git-branch`).
- A `CaptureDefinition` carries:
  - `scenario: (data: ScenarioData) => string | number | boolean | undefined` — how preview reads it from the scenario data (replaces the current `source` + `format` plumbing in `elements`).
  - `targets: Record<TargetId, TargetCaptureBinding>` — per-target opaque shell snippets: `{ setup: string[], ref: string, guard: string }`.
- Move existing `ElementDefinition.source`/`format` resolution into captures. An element now references a capture name (or stays a static `value` for icons/connectors).
- Rewrite bash/powershell exporters to consume captures generically: walk the style template, emit `setup` lines once per zone, emit the block body wrapped by the union of element guards, interpolate `ref`s where tokens appear.
- Delete the per-block `switch` dispatch in both exporters and the `generate*Block` family of functions.
- `BlockInstance` and block authoring (style templates) stay unchanged — the refactor is invisible to users.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `block-registry`: `BlockDefinition` gains a `captures` field; `ElementDefinition.source`/`format` are replaced by a `capture` reference.
- `bash-ps1-exporter`: emission strategy changes from per-block switch to generic walker driven by block captures. Output text for existing configs must remain equivalent.
- `powershell-exporter`: same, for PowerShell.

## Impact

- `src/lib/types.ts`: add `CaptureDefinition`, `TargetCaptureBinding`; modify `BlockDefinition`, `ElementDefinition`.
- `src/lib/data/blocks.ts`: every block gains `captures`; shell commands from bash.ts/powershell.ts move here.
- `src/lib/renderer.ts`: `resolveElementText` reads from captures instead of scenario directly.
- `src/lib/exporters/bash.ts`: shrinks from ~800 LOC to ~250 LOC as the switch and `generate*Block` functions collapse into a generic walker.
- `src/lib/exporters/powershell.ts`: shrinks from ~518 LOC to ~200 LOC.
- No new dependencies.
- Depends on: `refactor-shared-color-utils`.
- Unblocks: `unify-arrange-via-ir` (phase 3).
