## Context

The preview pipeline (`src/lib/renderer.ts`) is clean: blocks declare elements with `source`/`format`, scenarios supply a `ScenarioData` object, and the renderer resolves token text per-element. The exporters can't use this path because they don't have concrete data — they need to emit shell code that resolves at runtime. Today they solve this by carrying their own per-block knowledge: `bash.ts:466–488` has a `switch` of 14 cases; each case knows which shell command produces which variable and which check gates visibility.

This is N×M growth at the exporter boundary. Roadmap M3 adds Starship and Oh My Posh targets. Before that lands, the shell knowledge needs to move out of exporter logic and onto block definitions, keyed by target.

## Goals / Non-Goals

**Goals:**
- One source of truth for "how do I get a git branch?" — on the `git-branch` block, with entries per target.
- Exporters become generic walkers: they don't know what "git branch" is, only how to serialize a `CaptureDefinition` into their target language.
- Preview keeps using `ScenarioData` without any regression in rendering behavior.
- Shrink `bash.ts` and `powershell.ts` substantially; eliminate the per-block `switch`.

**Non-Goals:**
- Unify the zone-arrangement pipeline (powerline/powertab) — phase 3.
- Decouple exporters from zone IDs — phase 4.
- Model guards as symbolic expressions — user chose opaque per-target snippets. A `guard` is literally a shell `[[ … ]]` or `$var -ne ''` string, per target, never inspected by shared code.
- Support declarative targets (Starship, OMP). That's M3; the shape here should accommodate them but we don't implement them now.

## Decisions

### Decision: Captures are a block-level map, elements reference them by name

```ts
interface BlockDefinition {
  id: string; name: string; /* … */
  captures: Record<string, CaptureDefinition>;  // e.g. { branch: {...}, dirty: {...} }
  elements: Record<string, ElementDefinition>;  // template tokens
  styles: Record<string, string>;
  // …
}

interface CaptureDefinition {
  scenario: (data: ScenarioData) => string | number | boolean | undefined;
  targets: Record<TargetId, TargetCaptureBinding>;
}

interface TargetCaptureBinding {
  setup: string[];  // lines emitted once per capture, before the block body
  ref: string;      // interpolation reference ("$_branch", "$branch", "${branch}", etc.)
  guard: string;    // boolean expression ("[[ -n \"$_branch\" ]]", "$branch", …)
}

interface ElementDefinition {
  // Either a capture reference with optional format string…
  capture?: string; format?: string;
  // …or a static value (icons, connectors, literal chars)
  value?: string;
  role: ElementRole;
  themeSlot?: string;
}
```

Rationale: distinguishing captures from elements separates "what data do I need" from "how do I lay it out." One capture can feed multiple elements (e.g. `branch` used with different prefixes). Multiple captures share setup costs in a single block.

Alternative considered: keep everything on `ElementDefinition` with per-element `targets`. Rejected — bloats the shape, duplicates setup lines, makes the `ahead`/`behind` capture sharing awkward.

### Decision: `scenario` is a function, not a plain field name

Current `source: "branch"` does a dictionary lookup on `ScenarioData`. Fine, until an element wants something derived (combined values, defaulted values, formatted numbers). A function closes over this flexibility without adding a second path.

Alternative considered: keep `source: string` and add `transform?: (v) => v`. Rejected — two fields for one job.

### Decision: `guard` is a per-target opaque string, not a symbolic predicate

Per user decision in explore mode. The `compose()` middle never inspects a guard; it just asks the target to wrap a body when the guard is "present." This keeps the IR target-agnostic by deferring to each target's dialect.

Consequence: blocks that vary visibility per element (e.g. `git-branch` shows `ahead` only when `ahead > 0`) need per-capture guards, and the exporter's generic walker must emit nested conditionals (outer for the block, inner per-element). Shape stays simple; nesting is cheap.

### Decision: Preview reads captures, not raw scenario fields

`resolveElementText` in `renderer.ts` currently does:
```
const raw = (scenario as Record<string, unknown>)[elem.source];
```

Post-refactor:
```
const cap = block.captures[elem.capture];
const raw = cap.scenario(scenario);
```

This keeps one path through resolution. If an element has `value` (static), nothing changes. Format-string logic (`{}` substitution, flag-on-true) stays the same.

### Decision: Exporter walker shape

For each zone:
1. For each block instance, look up all captures referenced by its active style template.
2. Emit each capture's `setup` lines (deduped by name within the block).
3. Compute the block-level guard as the AND of all required captures' guards. For optional elements (ahead/behind), emit an inner guard at interpolation time.
4. Emit the block body: walk the style template, substitute each `{capture}` token with either `${cap.ref}` (when the capture is required) or `"$(guard && echo ...)"` (when the capture is optional).
5. Wrap the body in the target's conditional framing (`if …; then … fi` for bash; analogous for pwsh).

A target provides only:
```ts
interface Target {
  fgEscape(hex): string; bgEscape(hex): string; reset: string;
  emitConditional(guard: string, body: string[]): string[];
  emitOptional(guard: string, content: string): string;  // inline for per-element optionals
  // (more come in phase 3 for zone-level paint)
}
```

This is what lets bash.ts collapse. Every `generate*Block` function becomes a call to the same `emitBlock(block, style, target)`.

### Decision: Migration order — blocks first, then each exporter

1. Add `captures` to block definitions; keep `source`/`format` in elements as deprecated fallbacks.
2. Teach `renderer.ts` to prefer `capture` when present, fall back to `source` when not. Verify preview unchanged.
3. Rewrite `bash.ts` to use captures. Delete `generate*Block` + `switch`. Diff output against golden snapshots.
4. Rewrite `powershell.ts` same.
5. Remove deprecated `source`/`format` from `ElementDefinition` and strip from block definitions.

Each step is independently testable.

## Risks / Trade-offs

- **Risk: exporter output drift.** Many small string generations; easy to miss a case (`style === "zen"` branch in `generateGitBranchBlock` ordering dirty before branch). Mitigation: golden-file tests. Snapshot the current bash/pwsh output for every block × every style × representative layouts before starting; diff after. Archive the snapshots as fixtures.
- **Risk: guards-as-strings paint us into a corner.** If M3's Starship needs to know "is this guard 'non-empty string'?" it can't, because guards are opaque. Mitigation: if that arises, introduce a small enum tag alongside `guard` (`{ kind: "nonEmpty"; ref } | { kind: "raw"; expr }`). Not doing that now keeps the IR honest.
- **Risk: perf on preview.** Function-per-capture adds a closure call per element per render. Negligible at current block counts; note for virtual-scrolling work in M5.
- **Trade-off: `blocks.ts` grows** (~150 LOC of shell commands moving in). Worth it: exporters shrink more, and blocks.ts is where block-specific knowledge belongs.

## Migration Plan

Steps 1–5 above. Each is one PR-worth of work. Between steps 3 and 4, both exporters can coexist — the dedup pass in phase 1 already made their shared utility footprint small, so a temporary divergence is tolerable.

Rollback: revert the PR; the deprecated `source`/`format` paths still work through step 4, so rollback to pre-step-5 is always safe.

## Open Questions

- Do we want to generate one `PROMPT_COMMAND` registration per zone or retain today's single builder function with internal zone sections? (Current answer: retain; changing is out of scope for this phase.)
- Per-capture `setup` blocks use bash `local` — does pwsh need script-scoped `$script:` prefixes? Worth a spike when rewriting `powershell.ts`.
