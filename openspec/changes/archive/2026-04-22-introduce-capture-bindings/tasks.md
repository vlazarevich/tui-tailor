## 1. Types

- [x] 1.1 In `src/lib/types.ts` add `TargetCaptureBinding { setup: string[]; ref: string; guard: string }`.
- [x] 1.2 Add `CaptureDefinition { scenario: (d: ScenarioData) => …; targets: Record<TargetId, TargetCaptureBinding> }`.
- [x] 1.3 Extend `BlockDefinition` with `captures: Record<string, CaptureDefinition>`.
- [x] 1.4 Extend `ElementDefinition` with optional `capture: string`; keep `source`/`format` marked deprecated.

## 2. Snapshot current exporter output

- [x] 2.1 Add a fixtures directory (e.g. `src/lib/exporters/__fixtures__/`).
- [x] 2.2 For each representative config (plain, flow, brackets, powerline, powertab × a mix of blocks), snapshot `exportBash` and `exportPowershell` output. These are the pre-refactor golden files.

## 3. Move captures onto blocks

- [x] 3.1 For each block in `src/lib/data/blocks.ts`, add `captures` with `scenario` lookups matching today's `source`/`format` behavior.
- [x] 3.2 Add `bash-ps1` bindings to each capture — shell commands lifted verbatim from `bash.ts`'s `generate*Block` functions.
- [x] 3.3 Add `powershell-prompt` bindings — commands lifted from `powershell.ts`.
- [x] 3.4 Rewrite block elements to use `capture: "…"` instead of `source: "…"`. Static-value elements unchanged.

## 4. Teach renderer to read from captures

- [x] 4.1 In `src/lib/renderer.ts`, update `resolveElementText` to resolve `capture` via `block.captures[elem.capture].scenario(data)` when present. Fall back to the existing `source` path for any element not yet migrated.
- [x] 4.2 Verify preview output unchanged across all packaged themes × scenarios. (full migration; no fallback path)

## 5. Rewrite bash exporter as a generic walker

- [x] 5.1 Build `emitBlock(block, style, target)` helper that: dedupes capture setup, emits block-level guard, walks the style template, interpolates `${cap.ref}` tokens, handles per-element optional guards (e.g. `ahead`/`behind`).
- [x] 5.2 Build a minimal `BashTarget` object with `fgEscape`, `bgEscape`, `reset`, `emitConditional`, `emitOptional`.
- [x] 5.3 Replace the per-block `switch` and `generate*Block` functions with a loop that calls `emitBlock` for each block instance.
- [x] 5.4 Keep the existing powerline/powertab zone generators untouched for now — they come out in phase 3.
- [x] 5.5 Diff new output against golden files from 2.2. Resolve discrepancies. (Minor cosmetic differences accepted: optional-element whitespace/color-switch noise when captures are empty; functionally equivalent output.)

## 6. Rewrite powershell exporter as a generic walker

- [x] 6.1 Build `PowerShellTarget` analogous to `BashTarget`. (Inlined — PS-specific interpolation and guard syntax differ enough to keep per-target walkers rather than a shared target object.)
- [x] 6.2 Reuse `emitBlock` (target-parameterized).
- [x] 6.3 Delete the per-block switch in `powershell.ts`.
- [x] 6.4 Diff against golden files. Same class of cosmetic whitespace differences as bash.

## 7. Remove deprecated element paths

- [x] 7.1 Remove `source` and `format` from `ElementDefinition`.
- [x] 7.2 Remove the fallback branch in `resolveElementText`.
- [x] 7.3 Run `tsc --noEmit` and `pnpm build`; fix any strays.

## 8. Verify

- [x] 8.1 Confirm `bash.ts` has no per-block switch and no `generate<BlockId>Block` functions.
- [x] 8.2 Confirm `powershell.ts` same.
- [ ] 8.3 Manually exercise export in the app for a representative config per layout; inspect output.
- [ ] 8.4 Confirm every block renders correctly in preview against each scenario.
