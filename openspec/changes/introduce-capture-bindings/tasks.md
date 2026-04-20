## 1. Types

- [ ] 1.1 In `src/lib/types.ts` add `TargetCaptureBinding { setup: string[]; ref: string; guard: string }`.
- [ ] 1.2 Add `CaptureDefinition { scenario: (d: ScenarioData) => …; targets: Record<TargetId, TargetCaptureBinding> }`.
- [ ] 1.3 Extend `BlockDefinition` with `captures: Record<string, CaptureDefinition>`.
- [ ] 1.4 Extend `ElementDefinition` with optional `capture: string`; keep `source`/`format` marked deprecated.

## 2. Snapshot current exporter output

- [ ] 2.1 Add a fixtures directory (e.g. `src/lib/exporters/__fixtures__/`).
- [ ] 2.2 For each representative config (plain, flow, brackets, powerline, powertab × a mix of blocks), snapshot `exportBash` and `exportPowershell` output. These are the pre-refactor golden files.

## 3. Move captures onto blocks

- [ ] 3.1 For each block in `src/lib/data/blocks.ts`, add `captures` with `scenario` lookups matching today's `source`/`format` behavior.
- [ ] 3.2 Add `bash-ps1` bindings to each capture — shell commands lifted verbatim from `bash.ts`'s `generate*Block` functions.
- [ ] 3.3 Add `powershell-prompt` bindings — commands lifted from `powershell.ts`.
- [ ] 3.4 Rewrite block elements to use `capture: "…"` instead of `source: "…"`. Static-value elements unchanged.

## 4. Teach renderer to read from captures

- [ ] 4.1 In `src/lib/renderer.ts`, update `resolveElementText` to resolve `capture` via `block.captures[elem.capture].scenario(data)` when present. Fall back to the existing `source` path for any element not yet migrated.
- [ ] 4.2 Verify preview output unchanged across all packaged themes × scenarios.

## 5. Rewrite bash exporter as a generic walker

- [ ] 5.1 Build `emitBlock(block, style, target)` helper that: dedupes capture setup, emits block-level guard, walks the style template, interpolates `${cap.ref}` tokens, handles per-element optional guards (e.g. `ahead`/`behind`).
- [ ] 5.2 Build a minimal `BashTarget` object with `fgEscape`, `bgEscape`, `reset`, `emitConditional`, `emitOptional`.
- [ ] 5.3 Replace the per-block `switch` and `generate*Block` functions with a loop that calls `emitBlock` for each block instance.
- [ ] 5.4 Keep the existing powerline/powertab zone generators untouched for now — they come out in phase 3.
- [ ] 5.5 Diff new output against golden files from 2.2. Resolve discrepancies.

## 6. Rewrite powershell exporter as a generic walker

- [ ] 6.1 Build `PowerShellTarget` analogous to `BashTarget`.
- [ ] 6.2 Reuse `emitBlock` (target-parameterized).
- [ ] 6.3 Delete the per-block switch in `powershell.ts`.
- [ ] 6.4 Diff against golden files. Document any intentional whitespace/casing normalizations.

## 7. Remove deprecated element paths

- [ ] 7.1 Remove `source` and `format` from `ElementDefinition`.
- [ ] 7.2 Remove the fallback branch in `resolveElementText`.
- [ ] 7.3 Run `tsc --noEmit` and `pnpm build`; fix any strays.

## 8. Verify

- [ ] 8.1 Confirm `bash.ts` has no per-block switch and no `generate<BlockId>Block` functions.
- [ ] 8.2 Confirm `powershell.ts` same.
- [ ] 8.3 Manually exercise export in the app for a representative config per layout; inspect output.
- [ ] 8.4 Confirm every block renders correctly in preview against each scenario.
