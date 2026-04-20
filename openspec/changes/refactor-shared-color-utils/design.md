## Context

The renderer (`src/lib/renderer.ts`) and the two exporters (`src/lib/exporters/bash.ts`, `src/lib/exporters/powershell.ts`) each carry their own copies of: hex→rgb, relative luminance, auto-contrast, theme-slot resolution, and a handful of block-inspection helpers (`templateElems`, `blockIcon`, `blockConnector`, `blockStyleTemplate`). The duplication has already drifted — `bash.ts:27` computes auto-contrast with `1.05 / (lum + 0.05) >= (lum + 0.05) / 0.05`, which is not the WCAG ratio implemented in `renderer.ts:378`. The result is that preview and exported PS1 can pick different icon foregrounds on the same theme slot.

This change is the first of four staged refactors toward a unified emitter pipeline. It is deliberately scoped to behavior-preserving dedupe so the structural changes that follow (capture bindings, IR unification, zone target bindings) start from a clean base.

## Goals / Non-Goals

**Goals:**
- One implementation of each color utility, imported by renderer and exporters.
- One implementation of each block helper.
- One `isZoneEnabled` used by `Canvas`, `PreviewPane`, and exporters.
- Fix the auto-contrast drift as a side effect of converging on the renderer's WCAG formula.

**Non-Goals:**
- Restructure the exporters' per-block switches (that's phase 2).
- Change the zone-arrangement pipeline (phase 3).
- Remove hard-coded zone IDs (phase 4).
- Introduce new capabilities or change any requirements other than the bash auto-contrast fix.

## Decisions

### Decision: Two modules, not one

Split into `src/lib/color.ts` (color math + theme-slot lookup) and `src/lib/blockHelpers.ts` (block-shape inspection helpers). `isZoneEnabled` goes with the zone model in `composerContext.ts` (it takes a config + zone id). Keeping these separate keeps each file's concern crisp and avoids a junk-drawer `utils.ts`.

Alternative considered: one `lib/shared.ts`. Rejected — mixes color math with block introspection with zone logic.

### Decision: Adopt renderer's WCAG formula as the canonical auto-contrast

Renderer's `computeAutoContrast` implements the standard WCAG 2.x contrast ratio. Bash's `autoContrastHex` is algebraically different and produces different threshold behavior near mid-luminance. Since the user-facing expectation is "preview matches export," the renderer's formula wins.

### Decision: No behavior change in powershell.ts

Powershell's implementation already matches renderer (via its own copy). Dedupe is a no-op there; still worth doing because any future fix lands in one place.

### Decision: Theme-slot dash fallback lives in `color.ts`

`resolveSlot` (`vcs-ahead` → `vcs` fallback when no direct token exists) is theme logic, not general color math, but it's always called adjacent to color resolution. Ship it in `color.ts` with the other resolution helpers rather than splitting into a `theme.ts` for one function.

## Risks / Trade-offs

- **Risk: import cycles.** `color.ts` and `blockHelpers.ts` must not import from `renderer.ts` or `exporters/*`. Mitigation: keep them leaf modules; verify with a quick grep after extraction.
- **Risk: a visual regression where someone depended on bash's broken auto-contrast.** Extremely unlikely — the disagreement manifests only on specific theme slots near the WCAG threshold. Mitigation: screenshot the existing export panel against the five packaged themes for all blocks before and after; any diff is the expected fix.
- **Trade-off: one more file in `src/lib/`.** Minor; alternative is larger drift.

## Migration Plan

1. Land `color.ts` and `blockHelpers.ts` with the canonical implementations. Add both to the existing lint/TS project.
2. Redirect imports in `renderer.ts`, `bash.ts`, `powershell.ts` one file at a time. After each, run the app and diff preview/export output for the packaged themes.
3. Delete the now-dead local copies.
4. Move `isZoneEnabled` last — three call sites, trivial.

No rollback needed beyond a git revert. No runtime surface changes.
