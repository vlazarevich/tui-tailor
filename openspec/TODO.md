## Logic drift / likely bugs

1. `autoContrastHex` in bash.ts (line 27) is broken. It reads `1.05 / (lum + 0.05) >= (lum + 0.05) / 0.05` — the black-contrast denominator should be `(0 + 0.05) = 0.05`, fine, but the numerator should be `(lum + 0.05), not (lum + 0.05) / 0.05` — that's already the ratio. Comparing `1.05/(L+0.05) to (L+0.05)/0.05` ≠ what `computeAutoContrast` in renderer.ts does. They will flip at different luminance thresholds. Preview and exported PS1 can disagree on icon foreground color.
2. `generateGitBranchBlock` — zen style likely broken when not in a git repo. It always writes `if [[-n "$_branch"]]` but in zen-with-dirty the append line goes inside the if, in zen-without-dirty no append is emitted at all (bash.ts:289: `if (style !== "zen") lines.push(...)`). So "zen" + no dirty element → empty output even in a git repo.
3. `collapseSpaces` in renderer.ts is called twice' worth of logic (three passes, lines 99–138). The second while-pops overlap with the final loop at 126–136. Works but is hard to follow; easy source of off-by-one.
4. `resolveElementText` treats 0 as empty (renderer.ts:55) — fine for ahead/behind counts, but exitCode: 0 never renders, which is currently correct only because the exit-code block is already gated by visibility. Coupled logic.
5. Token regex `\{(\w+)\} `vs literal braces — a style template can never render a literal { or }. Probably fine today but worth a comment.
6. `computeBlockVisibility` ignores `role: "icon" | "connector"` but treats `role: "content"` with static value as visible — a content element with a hardcoded value makes the block always visible even when its data fields are empty. No current block hits this; it's a landmine for later.
7. persistence.ts migration: `migrateZones` mutates in place, overwrites with undefined layout when invalid — downstream `zone.layout ?? defaultLayout` handles it, but the as `ZoneLayoutType` coercion on line 16 lies. Minor.
8. `decodeConfig` accepts any object with surfaceId and zones as a valid `SurfaceConfig`. A malformed base64 paste can inject arbitrary blockIds / styles that the renderer silently skips — safe, but user sees "loaded" with nothing. Worth a real validator.
9. `handleExport` in `ExportPanel` uses `navigator.clipboard.writeText` with no catch — in insecure contexts (http:// or iframed preview) this rejects and the user sees "Copy config string" with no feedback.

## Maintainability friction

- Ad-hoc string keys everywhere: `"left-prompt"`, `"right-prompt"`, `"continuation-prompt"`, `"prompt-char"`, `"multiline"` are magic strings scattered across `PreviewPane`, bash.ts (`generatePromptSection`), `ExportPopup`, `ZoneEditor`. The whole point of a "zone-based, surface-first" model is surfaces declare their zones — but `generatePromptSection` is hard-coded to exactly these three. Adding a surface (M4) will require touching every exporter. These should come from `SURFACES`.
- `PlainConfig` and `FlowConfig` have the same shape (`{ gap: string }`), and `PowerlineConfig`/`PowertabConfig` are identical (`{ separator, terminator }`). The discriminated union in types.ts:66 adds type-friction without expressive power. Consider collapsing, or giving each layout its real distinct knobs.
- Two parallel `isZoneEnabled` implementations — one in `PreviewPane` (line 59), one in `bash.ts` (line 657), one in `Canvas` (line 17). Should live on `composerContext` or surfaces.
- Themes resolution pattern (`--tt-color-{slot}` with - fallback) is reimplemented three times (renderer, bash, powershell). One utility.
- `ComposerAction` has 14 variants, most of them zone-scoped mutations that share the same `config.zones[zoneId] ?? { blocks: [] }` prelude. A generic `UPDATE_ZONE(zoneId, (z) => z)` would compress the reducer by ~60%.
- `useReducer` + `useRef` debounced save in `AppShell`: the save-timer `useRef(null)` stores `setTimeout` return but also clears on every effect run. The cleanup runs on every config change too, so the debounce works — but `saveTimer.current = null` after `clearTimeout` would be cleaner.
- `arrangePowertab` end branch (line 292–296) has if/else emitting the same span — dead code.

## Design mismatches vs the stated model

> From CLAUDE.md: "blocks reference theme slots, not raw colors" and "block × target has an integer cost":

- `exportCosts` on blocks is effectively unused. Every block in blocks.ts sets "bash-ps1": 0, "powershell-prompt": 0. And `EXPORT_TARGETS.blockCosts` is `{}` everywhere. The "recommend lowest-cost target" from the roadmap has no data behind it yet. That's fine for M2 but worth surfacing: the cost model is plumbed through types without any values. When Starship/OMP arrive, the question of where costs live (block vs. target) will matter — and you've declared it in both places.
- "Curated style presets — not granular knobs": good, styles are zen/minimal/extended. But the rendering of `{dirty}` in zen "puts dirty before branch" is a special-case hack in the `exporter` (bash.ts:282), not encoded in the block definition. The style template `"{dirty} {branch}"` already says this; the exporter is duplicating the ordering knowledge.
- Zone cost warnings (ExportPopup.tsx:33) only warn based on `zoneCosts[zoneDef.id] > 0`. Blocks not supported by `generatePowerlineBlockContent` silently disappear — that's a per-block cost of 100 that nobody's declared.

## Small things I'd note

- `composerReducer` mutates through Object.entries iteration order — fine in practice, insertion-ordered since ES2015.
- `emitElements` loops block elements twice (once here, again in `selectSpans` reading the dict) — negligible.
- `ExportPopup` `INSTALL_HINTS` duplicates the "Add to ~/.bashrc" comment that bash.ts:157 already emits into the colors section. Two sources of truth.
- `ZoneEditor` `handleMoveLeft` sets `openPopup` to the new index but the old anchor — if the popup re-renders against a moved DOM node, position could be wrong. Low-risk.

# Big refactor:

1. refactor-shared-color-utils (prep, low-risk dedupe)
2. introduce-capture-bindings (move shell commands onto blocks; exporters still have switches but consume bindings)
3. unify-arrange-via-ir (delete generatePowerlineZoneCode/generatePowertabZoneCode, single layout engine)
4. zone-target-bindings (remove hard-coded zone IDs from exporters)
