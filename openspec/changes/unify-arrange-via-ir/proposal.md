## Why

The zone-arrangement stage — how blocks get laid out into plain/flow/brackets/powerline/powertab — exists twice. Once in `src/lib/renderer.ts` (`arrangePlain`/`arrangeFlow`/`arrangeBrackets`/`arrangePowerline`/`arrangePowertab`) for the preview, and once in `src/lib/exporters/bash.ts` (`generatePowerlineZoneCode`, `generatePowertabZoneCode`) for Bash export. The exporter copy is incomplete: `generatePowerlineBlockContent` hard-codes support for only 7 block IDs (`cwd`, `user`, `host`, `time`, `git-branch`, `exit-code`, `node-version`) and silently returns `null` for everything else.

Consequence today: if a user adds `git-status`, `jobs`, `cmd-duration`, or any cloud block to a powerline zone, **the preview renders it correctly but the exported Bash drops it with no warning**. That's a direct breach of the "preview accuracy is first-class" constraint in `.claude/CLAUDE.md`.

Phase 3 of the exporter/renderer unification refactor. Makes zone arrangement a single target-agnostic function that produces an intermediate representation consumed by both preview and exporters. Depends on phase 2 (`introduce-capture-bindings`).

## What Changes

- Promote the render-span types in `renderer.ts` (`RenderSpan`, `BlockSpans`) to a standalone module `src/lib/compose/ir.ts` as the canonical IR.
- Move `arrangePlain`/`arrangeFlow`/`arrangeBrackets`/`arrangePowerline`/`arrangePowertab` into `src/lib/compose/arrange.ts`. Each takes block capture data and a layout config; produces `RenderSpan[]`. No change to preview behavior.
- Bash and PowerShell exporters consume `RenderSpan[]` directly and paint it into target-specific output (ANSI escapes, conditionals wrapping groups of spans).
- Delete `generatePowerlineZoneCode` and `generatePowertabZoneCode` from `bash.ts` (~200 LOC).
- Delete `generatePowerlineBlockContent` (the 7-block hardcoded list).
- Export cost: blocks whose captures don't declare a binding for the active target are surfaced in `ExportPopup` as warnings with the block name, not silently dropped.

## Capabilities

### New Capabilities

None. The IR is an internal implementation detail.

### Modified Capabilities

- `block-rendering`: arrangement functions move to `src/lib/compose/arrange.ts`; output shape unchanged. No requirement change.
- `bash-ps1-exporter`: **correctness fix** — powerline/powertab zones now render every block type the preview can render. Previously-dropped blocks appear in output.
- `powershell-exporter`: same correctness posture; gains powerline/powertab via the unified arrange path if it didn't have them.
- `export-panel`: warnings surface per-block when a capture lacks a target binding.

## Impact

- New: `src/lib/compose/ir.ts`, `src/lib/compose/arrange.ts`.
- Modified: `src/lib/renderer.ts` (delegate arrange to compose), `src/lib/exporters/bash.ts` (consume IR, delete zone generators), `src/lib/exporters/powershell.ts` (same), `src/components/ExportPopup.tsx` (per-block warnings).
- Deleted from `bash.ts`: `generatePowerlineZoneCode`, `generatePowertabZoneCode`, `generatePowerlineBlockContent`, the `_segs`/`_bgs`/`_fgs`/`_sfs` array-builder scaffolding.
- No new dependencies.
- Depends on: `introduce-capture-bindings`.
- Unblocks: `zone-target-bindings` (phase 4), and M3 targets (Starship, Oh My Posh) which plug in at this boundary.
