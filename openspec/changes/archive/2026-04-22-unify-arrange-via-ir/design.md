## Context

After phase 2, shell commands live on block definitions and exporters walk captures. But zone layout logic is still forked. The renderer's `arrange*` family knows how to build powerline edges and powertab regions; the exporter has its own incomplete reimplementation in `generatePowerlineZoneCode` and `generatePowerlineBlockContent` (bash.ts:492–596). They have drifted in coverage (7 blocks vs. all blocks) and feature support (powertab only exists in the renderer's form).

The fix: arrangement becomes one function that every target consumes. The IR is what the renderer already produces — `RenderSpan[]` with `fg`, `bg`, `role`, and theme slots. Every layout concern (separators, terminators, bracket chars, powerline edges) encodes as spans with roles.

## Goals / Non-Goals

**Goals:**
- Single source of truth for zone arrangement; all targets consume the same `RenderSpan[]`.
- Preview-vs-export byte-equivalence for supported blocks in all five layouts.
- Blocks with missing target bindings produce an explicit warning in the export UI, not a silent drop.
- Delete ~200 LOC of duplicated arrangement code.

**Non-Goals:**
- Redesign the IR shape. Keep `RenderSpan` as-is; the only change is that it lives in `compose/ir.ts` instead of `renderer.ts`.
- Decouple exporters from zone IDs (phase 4).
- Add new layout types.
- Implement M3 targets — this change prepares the boundary; M3 lands later.

## Decisions

### Decision: `RenderSpan[]` is the canonical IR

No new types. The renderer's existing span encoding already carries everything arrangers emit (text, fg slot, bg slot, role). Exporters translate each span into their target dialect: preview → inline style, bash → ANSI escape wrapped in `\[...\]`, pwsh → `[char]27` escape.

Alternative considered: a richer IR with explicit `Segment` groupings and nested guards. Rejected — this scope is zone arrangement, not block guarding (handled in phase 2). A flat span array keeps paint trivially target-agnostic.

### Decision: Conditional rendering happens at capture emit time, not IR time

In preview, invisible blocks are dropped before `arrange` runs (via `computeBlockVisibility`). In exports, blocks are wrapped in shell conditionals that compose the rendered spans of their body. This split is already in place — we are not moving conditionals into the IR.

Consequence: each exporter target needs to know "this group of spans belongs to block X and must be emitted inside X's guard." We pass the block-span grouping through arrange output as a secondary index: `{ spans: RenderSpan[], blockBoundaries: Array<{ blockIndex, start, end, guard }> }`. The preview ignores `blockBoundaries`; bash uses them to wrap output in `if … then … fi`.

### Decision: Target interface grows minimally

Phase 2 introduced `Target.emitConditional`. This phase adds:
```ts
interface Target {
  // phase 2
  fgEscape(hex): string; bgEscape(hex): string; reset: string;
  emitConditional(guard, body): string[];

  // phase 3
  paintSpan(span: RenderSpan, theme: ThemeDefinition): string;
  // joins painted spans for a zone — newline strategy varies
  joinZone(painted: string[]): string;
}
```

Preview has its own "target" for IR consumption: `paintSpan` returns a React element, `joinZone` wraps in a fragment.

### Decision: Missing-binding warnings are data, not console logs

When `ExportPopup` builds output, it asks the walker for a report: `{ emitted: string[], warnings: Array<{ blockName, reason }> }`. Reasons: `"no <target> binding for capture X"`. The UI surfaces these alongside the existing zone-cost warnings.

### Decision: Migration via parallel implementation, then swap

1. Land `compose/ir.ts` and `compose/arrange.ts` with the code moved verbatim from `renderer.ts`. Renderer imports from compose; output unchanged.
2. Teach `bash.ts` a new code path that consumes `compose/arrange` output and paints it. Keep the old powerline/powertab generators live but unused.
3. Flip the switch: bash calls the new path. Diff golden files. Fix.
4. Delete the old generators.
5. Same for powershell (if it had powerline; otherwise just standardizes plain/flow/brackets via the same path).

## Risks / Trade-offs

- **Risk: golden-file output changes because the renderer's arrange is more complete than the exporter's.** That's the expected fix, but it will look like diff noise. Mitigation: annotate each golden-file diff with the block that newly appears (or was newly dropped) and confirm it's intentional.
- **Risk: powerline edge rendering in bash requires span ordering to be exactly right.** Powerline separators have `fg=block[i].slot, bg=block[i+1].slot`; the renderer already emits them that way, and the exporter must not reshuffle. Mitigation: golden fixtures cover powerline zones with 1, 2, 3, and 5 visible blocks.
- **Risk: the `blockBoundaries` index leaks block identity into the IR.** Accept it — the alternative is to duplicate guard wrapping in every arrange function, which reintroduces the split we're closing. The index is metadata the preview simply ignores.
- **Trade-off: one more tiny module dir (`compose/`).** Worth it to signal "this is the shared core, not target-specific."

## Migration Plan

Steps 1–5 above. The dangerous moment is step 3 (the flip). Mitigate by keeping the pre-flip path behind a `USE_NEW_ARRANGE` constant for one commit, flipping, then removing the constant.

Rollback: revert the flip commit. The new code path stays in the tree but unused.

## Open Questions

- Does `blockBoundaries` need to carry more than `{ blockIndex, start, end, guard }`? Phase 4 (zone bindings) might want to annotate per-zone framing (PS1 vs PS2 slot). Leave the structure open to extension.
- Should the ExportPopup warnings group per-block or per-capture? Per-block is friendlier; per-capture is more precise. Start per-block, revisit if users ask.
