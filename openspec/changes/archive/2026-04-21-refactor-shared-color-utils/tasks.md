## 1. Extract color utilities

- [x] 1.1 Create `src/lib/color.ts` with `hexToRgb`, `relativeLuminance`, `autoContrast(bgHex): "#ffffff" | "#000000"`, `resolveSlot(slot, theme)` (with dash-fallback).
- [x] 1.2 Adopt the WCAG formula from `renderer.ts:378` as canonical for `autoContrast`. Discard `bash.ts:27`'s formula.
- [x] 1.3 Export hex→ANSI escape builders only if more than one target uses them (otherwise keep per-target).

## 2. Extract block helpers

- [x] 2.1 Create `src/lib/blockHelpers.ts` with `templateElems`, `blockIcon`, `blockConnector`, `blockStyleTemplate`.
- [x] 2.2 Ensure the module has no imports from `renderer.ts` or `exporters/*` (leaf module).

## 3. Unify `isZoneEnabled`

- [x] 3.1 Add `isZoneEnabled(zoneId, config)` to `src/lib/composerContext.ts` (or `src/lib/zones.ts`).
- [x] 3.2 Replace inline copies in `Canvas.tsx`, `PreviewPane.tsx`, and `exporters/bash.ts`.

## 4. Redirect imports and delete duplicates

- [x] 4.1 Redirect `src/lib/renderer.ts` to import from `color.ts`; delete its local copies.
- [x] 4.2 Redirect `src/lib/exporters/bash.ts` to import from `color.ts` and `blockHelpers.ts`; delete local copies.
- [x] 4.3 Redirect `src/lib/exporters/powershell.ts` to import from `color.ts` and `blockHelpers.ts`; delete local copies.
- [x] 4.4 Run `tsc --noEmit` and `pnpm build`; fix any import cycles.

## 5. Verify

- [x] 5.1 Open the app, visually diff preview vs. exported Bash across all packaged themes with a block on every theme slot.
- [x] 5.2 Confirm powerline/powertab auto-contrast foreground now matches preview on the previously-divergent theme slot.
- [x] 5.3 Spot-check PowerShell export output is byte-identical to the pre-refactor snapshot for at least one non-trivial config.
