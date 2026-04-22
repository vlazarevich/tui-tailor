## Context

`generatePromptSection` in `bash.ts:668–791` knows exactly three zones by ID: `left-prompt` → builds `_ps1` → assigns `PS1`; `right-prompt` → builds `_rps1` → emits printf with cursor positioning; `continuation-prompt` → builds `_ps2` → assigns `PS2`. `powershell.ts` has a parallel structure. For M4, surfaces will have entirely different zone IDs (`status-left` and `status-right` in tmux; `lualine.sections.a..z` in lualine); for M3, targets have entirely different output slots (Starship uses `format` and `right_format` in TOML; OMP uses positioned `segments` in JSON).

Both shifts need the same fix: move zone-to-target mapping from exporter logic to surface data.

## Goals / Non-Goals

**Goals:**
- `SURFACES[].zones[i].targetBindings` is the single source of truth for how a zone reaches a target's output.
- Exporters iterate surface zones and read bindings; they do not reference zone IDs by string literal.
- Adding a new surface or a new target requires edits to `surfaces.ts` / `exportTargets.ts` and a target adapter, not to the logic that arranges zones into output.

**Non-Goals:**
- Unify target output beyond zone slot assignment (the IR paint work is in phase 3).
- Merge `ZoneTargetBinding` with `blockCosts`/`zoneCosts` cost model — leave cost a separate concern.
- Eliminate strategy-specific emitters (e.g. the ANSI cursor trick still exists as code; the change is that it is selected by declarative binding, not by ID match).

## Decisions

### Decision: Explicit per-target bindings, not a symbolic role enum

User chose Option B from the explore conversation. Each zone × target pair has its own binding object; no shared "role" vocabulary across targets.

```ts
interface ZoneTargetBinding {
  slot: string;                 // target-specific output slot identifier
  strategy?: string;            // target-specific rendering strategy
  // additional fields as targets need them
}

interface ZoneDefinition {
  id: string; name: string; optional?: boolean;
  targetBindings: Record<TargetId, ZoneTargetBinding>;
}
```

Examples for the existing `terminal-prompt` surface:
```
left-prompt:
  bash-ps1:        { slot: "PS1" }
  powershell:      { slot: "prompt-body" }
right-prompt:
  bash-ps1:        { slot: "PS1", strategy: "ansi-cursor" }
  powershell:      { slot: "rprompt" }
continuation-prompt:
  bash-ps1:        { slot: "PS2" }
  powershell:      { slot: "continuation" }
```

Rationale: a symbolic `role: "primary" | "continuation" | "right-overlay"` forces every target to implement the whole vocabulary, including strategies that don't apply (Starship has no cursor-overlay concept; it has a proper `right_format`). Explicit bindings are honest about how each target handles each zone.

Alternative considered: `role` + per-target overrides. Rejected — overlapping mechanisms, no gain over explicit bindings given today's small surface count.

### Decision: Target adapter declares what slots it understands

A target's adapter defines a `slots: Record<string, SlotHandler>` map. The exporter walks each zone in surface order, looks up the adapter's handler for the binding's `slot`, and dispatches. Unknown slots (zone declares binding the target doesn't implement) raise a build-time type error, or at runtime a "target X does not support slot Y" warning surfaced in the export panel.

### Decision: Keep right-prompt's cursor-positioning strategy behind an explicit flag

`{ slot: "PS1", strategy: "ansi-cursor" }` is honest about what Bash does with right-aligned text. A target without a native right-prompt (like certain shell dialects) can still bind a zone to this strategy; a target with native support (Starship `right_format`) has a cleaner `{ slot: "right_format" }` binding. Zone IDs don't need to change across targets.

### Decision: Migration in two steps

1. Add `targetBindings` to `ZoneDefinition` and populate for the existing surface; rewrite `generatePromptSection` to consume bindings, but keep hardcoded ID strings side-by-side as a safety net (logging a warning if mismatch detected).
2. Remove the fallback. Verify no exporter test references a zone by string literal.

## Risks / Trade-offs

- **Risk: exporters drift again as bindings grow.** If M3 Starship adds a `format-order` field, every target needs to decide whether to support it. Mitigation: `ZoneTargetBinding` stays a small record per target; target-specific fields live inside target-specific subtypes (discriminated on `slot` or target).
- **Risk: the three current zones of `terminal-prompt` make the abstraction look underused.** Accept — the payoff is M3 and M4, not today. The migration is still a code-quality win even with one surface.
- **Trade-off: the "+ right-prompt is actually PS1-with-cursor-trick" awkwardness is now explicit instead of hidden.** That's the point. Users and future contributors can see what the bash target is doing at the boundary.

## Migration Plan

1. Add types and data (`ZoneTargetBinding`, populated in `surfaces.ts`).
2. Add slot-handler registration to each target adapter. Move existing PS1/PS2/right-prompt code into handlers keyed by slot.
3. Rewrite `generatePromptSection` as: for zone in surface.zones; get binding; dispatch to handler. Same for pwsh.
4. Delete all zone-ID string literals from exporter logic. Grep confirms.
5. Verify: snapshots match byte-for-byte (no behavior change is expected since the current surface maps 1:1 onto the new bindings).

Rollback: revert. The old hardcoded path remains in history; no persistent state changes.
