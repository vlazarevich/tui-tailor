## Why

The "surface-first" model in `.claude/CLAUDE.md` says surfaces declare their zones and exporters should follow. In practice, `bash.ts:675` hard-codes the three zone IDs `"left-prompt"`, `"right-prompt"`, `"continuation-prompt"` and contains bespoke logic for each (PS1 assignment, ANSI cursor-positioning trick, PS2 assignment). Any M4 surface (neovim statusline, tmux status bar, zellij tab bar, Claude Code statusline) that defines different zones will require touching every exporter.

Phase 4 of the exporter/renderer unification refactor. Zones declare how they bind to targets; exporters iterate `SURFACES[].zones` and follow those bindings instead of matching by ID.

## What Changes

- Extend `ZoneDefinition` with `targetBindings: Record<TargetId, ZoneTargetBinding>`.
- Define `ZoneTargetBinding` as an explicit per-target description of how a zone maps into the target's output (e.g. `{ slot: "PS1" }`, `{ slot: "PS1", strategy: "ansi-cursor" }`, `{ slot: "PS2" }`). Per user decision, this is explicit per-target configuration, **not** a symbolic role enum.
- Update `surfaces.ts` so the single existing `terminal-prompt` surface declares bindings for its three zones across `bash-ps1` and `powershell-prompt`.
- Rewrite `generatePromptSection` in `bash.ts` to iterate `SURFACES[].zones` and dispatch by `targetBindings`, not by zone ID.
- Same for `powershell.ts`.
- A new M4 surface with its own zones can be added to `surfaces.ts` without touching any exporter, provided its zones declare bindings for the targets it supports.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `block-registry`: `ZoneDefinition` (declared in `surfaces.ts`, referenced by surfaces) gains `targetBindings`.
- `bash-ps1-exporter`: `generatePromptSection` iterates surface zones generically; no hardcoded zone IDs remain in `src/lib/exporters/bash.ts`.
- `powershell-exporter`: same.

## Impact

- `src/lib/types.ts`: add `ZoneTargetBinding`; extend `ZoneDefinition`.
- `src/lib/data/surfaces.ts`: populate `targetBindings` for the three existing zones.
- `src/lib/exporters/bash.ts`: remove hard-coded zone ID references; drive output from `targetBindings`.
- `src/lib/exporters/powershell.ts`: same.
- `src/lib/data/exportTargets.ts`: `zoneCosts` may be computable from bindings (a binding with `strategy: "ansi-cursor"` implies cost > 0); leave that optimization for later.
- No new dependencies.
- Depends on: `unify-arrange-via-ir`.
- Unblocks: M4 (additional surfaces) and M3 targets that have different zone slot names (Starship has one `format`, Oh My Posh has `segments`).
