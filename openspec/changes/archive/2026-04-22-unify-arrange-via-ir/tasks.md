## 1. Extract IR and arrange into `compose/`

- [x] 1.1 Create `src/lib/compose/ir.ts`. Move `RenderSpan`, `BlockSpans`, and related types here. Re-export from `renderer.ts` for now.
- [x] 1.2 Create `src/lib/compose/arrange.ts`. Move `arrangePlain`, `arrangeFlow`, `arrangeBrackets`, `arrangePowerline`, `arrangePowertab`, and `arrangeZone` here, verbatim.
- [x] 1.3 Extend arrange output with `blockBoundaries: Array<{ blockIndex, start, end }>`. (Dropped `guard` field — target computes from block definition; keeps IR target-agnostic.)
- [x] 1.4 `renderer.ts` imports arrange from compose; preview output unchanged for plain/flow/brackets. Powerline/powertab changed per design decision (see below).

## 2. Teach Bash exporter to paint IR

- [x] 2.1 `BashTarget.fgSlot/fgAuto/fgMuted/fgBorder/bgSlot/reset` abstractions added. (Renamed from paintSpan/joinZone — painter is a free function `paintRange`.)
- [x] 2.2 New bash path: per-zone `arrangeZone` → `paintRange` per block boundary → wrap in per-block guard with per-block setup lines.
- [x] 2.3 Direct flip (no `USE_NEW_ARRANGE` gate) — user agreed to rearchitect both preview and export together via self-terminating pill model, so one-shot transition was lower risk than gated.

## 3. Flip Bash to IR path

- [x] 3.1 Fixtures existed from phase 2 (`src/lib/exporters/__fixtures__/`).
- [x] 3.2 Flipped. Diffed.
- [x] 3.3 Expected diffs: (a) powerline now includes every block instead of the hardcoded 7; (b) powerline separators no longer depend on next-block slot — each block is a self-contained pill using `` lead + `` trail chevrons with `fg=slot, bg=default`; (c) powertab uses `` / `` with option-A layout (colored icon tab + plain content on default bg); (d) whitespace collapsed per `selectSpans`.
- [x] 3.4 `generatePowerlineZoneCode`, `generatePowertabZoneCode`, `generatePowerlineBlockContent` deleted. No `USE_NEW_ARRANGE` constant (direct flip).

## 4. Do the same for PowerShell

- [x] 4.1 `PSTarget` abstractions parallel to `BashTarget`.
- [x] 4.2 PowerShell routed through `compose/arrange`.
- [x] 4.3 Diffed against golden fixtures. PowerShell previously had no powerline/powertab support — now it does, for free. Plain/flow/brackets outputs equivalent to phase-2 modulo same cosmetic whitespace changes as bash.
- [x] 4.4 No zone-layout code left in `powershell.ts`.

## 5. Missing-binding warnings

- [x] 5.1 `SurfaceExportResult` extended with `warnings: ExportWarning[]`. `exportSurfaceDetailed` exposes the full result; `exportSurface` preserves the sections-only API for callers that don't need warnings.
- [x] 5.2 Both bash and powershell walkers produce an `ExportWarning` when a required capture has no binding for the active target; the affected block is omitted from the emitted code.
- [x] 5.3 `ExportPopup.tsx` renders `blockWarnings` in the same warnings row as zone-cost warnings.
- [x] 5.4 The warning mechanism is wired end-to-end. No block in the current registry has a missing binding for either target, so the warning is not triggered in normal use; would need a test fixture or a deliberately broken block to exercise. (Left to follow-up or M3 when new targets without full coverage land.)

## 6. Verify

- [x] 6.1 Manual: added every block to a powerline zone, preview == export confirmed.
- [x] 6.2 Manual: added every block to a powertab zone, preview == export confirmed.
- [x] 6.3 `grep` in `src/lib/exporters/` for layout-specific function names: only `generateColorsSection` and `generatePromptSection` remain, no `generate*Block` or zone-layout generators.
- [x] 6.4 Preview confirmed across packaged themes × scenarios. Plain/flow/brackets behave identically (arrange code moved verbatim). Powerline/powertab use the self-terminating pill model with identical lead/trail chevrons and explicit terminal-surface bg.
