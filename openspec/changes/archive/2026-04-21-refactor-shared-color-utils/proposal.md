## Why

Color and block-helper utilities are reimplemented 2–3 times across `src/lib/renderer.ts`, `src/lib/exporters/bash.ts`, and `src/lib/exporters/powershell.ts`. They have already drifted: `autoContrastHex` in `bash.ts:27` uses a broken ratio comparison that disagrees with `computeAutoContrast` in `renderer.ts:378`, so the preview and the exported PS1 can pick different icon colors at the same luminance. Phase 1 of a four-part refactor to unify renderer and exporters — the dedupe lands first because it is behavior-preserving and unblocks the structural changes that follow.

## What Changes

- Introduce `src/lib/color.ts` with single implementations of `hexToRgb`, `relativeLuminance`, `autoContrast`, and the `resolveSlot(slot, theme)` theme-slot lookup (with dash-fallback: `vcs-ahead` → `vcs`).
- Introduce `src/lib/blockHelpers.ts` with single implementations of `templateElems`, `blockIcon`, `blockConnector`, `blockStyleTemplate`.
- Move `isZoneEnabled` into `src/lib/composerContext.ts` (or a new `src/lib/zones.ts`) so `Canvas.tsx`, `PreviewPane.tsx`, and `bash.ts` all call one function.
- Delete the duplicate copies from `renderer.ts`, `exporters/bash.ts`, `exporters/powershell.ts`.
- **Fix as side effect**: bash's `autoContrastHex` converges on the renderer's WCAG formula. Where powerline/powertab exports currently pick the wrong contrast color at edge luminances, they now match the preview.

No behavior change is intended for any non-drifted call site. Preview output and exporter output must remain byte-identical for unaffected cases.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `bash-ps1-exporter`: auto-contrast algorithm aligns with the preview's WCAG formula (corrects a latent bug where edge-luminance colors diverged).

## Impact

- New: `src/lib/color.ts`, `src/lib/blockHelpers.ts` (and possibly `src/lib/zones.ts`).
- Modified: `src/lib/renderer.ts`, `src/lib/exporters/bash.ts`, `src/lib/exporters/powershell.ts`, `src/components/Canvas.tsx`, `src/components/PreviewPane.tsx`.
- No new dependencies.
- Unblocks: `introduce-capture-bindings` (phase 2), `unify-arrange-via-ir` (phase 3), `zone-target-bindings` (phase 4).
