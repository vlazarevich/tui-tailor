## 1. Types and Data Model

- [x] 1.1 Add `ElementDefinition` type to `types.ts` — `{ source?: string, value?: string, format?: string, role: 'content' | 'icon' | 'connector', themeSlot?: string }`
- [x] 1.2 Refactor `BlockDefinition` in `types.ts` — replace `styles: Record<string, StylePreset>` with `elements: Record<string, ElementDefinition>` and `styles: Record<string, string>` (element template strings)
- [x] 1.3 Add `ResolvedElement` type — `{ name: string, text: string, themeSlot: string, role: 'content' | 'icon' | 'connector' }`
- [x] 1.4 Add `RenderSpan` type — `{ text: string, fg: string | null, bg: string | null, role: 'content' | 'icon' | 'connector' | 'bracket' | 'separator' }`
- [x] 1.5 Add `ZoneLayout` type — `{ type: 'plain' | 'flow' | 'brackets' | 'powerline' | 'powertab', config: PlainConfig | FlowConfig | BracketsConfig | PowerlineConfig | PowertabConfig }`
- [x] 1.6 Add `ScenarioData` type — typed object with all terminal-prompt scenario fields (cwd, user, host, branch, dirty, staged, unstaged, untracked, ahead, behind, exitCode, nodeVersion, pythonVersion, etc.)
- [x] 1.7 Add `ZoneLayout` field to zone config in `SurfaceConfig` (default: plain with gap " ")
- [x] 1.8 Remove old `StylePreset` type (`{ format: string, icon: boolean }`)

## 2. Refactor Existing Blocks to Element Model

- [x] 2.1 Refactor `user` block — elements: username (source: user), icon, connector ("as"); styles as element templates
- [x] 2.2 Refactor `host` block — elements: hostname (source: host), icon, connector ("at"); styles as element templates
- [x] 2.3 Refactor `cwd` block — elements: dir (source: cwd), icon, connector ("in"); styles as element templates
- [x] 2.4 Refactor `git-branch` block — elements: branch, icon, ahead (themeSlot: vcs-ahead, format: "↑{}"), behind (themeSlot: vcs-behind, format: "↓{}"), dirty (themeSlot: vcs-dirty, format: "*"), connector ("on"); styles as element templates
- [x] 2.5 Refactor `git-status` block — elements: staged (format: "+{}"), unstaged (format: "~{}"), untracked (format: "?{}"), icon, connector; styles as element templates
- [x] 2.6 Refactor `exit-code` block — elements: code (source: exitCode), icon, connector; styles as element templates
- [x] 2.7 Refactor `time` block — elements: time (source: time), icon, connector; styles as element templates

## 3. Add New Blocks

- [x] 3.1 Add environment blocks: `node-version`, `python-version`, `ruby-version`, `golang-version`, `rust-version`, `java-version` — each with elements (version source, icon, connector), zen/minimal/extended templates
- [x] 3.2 Add cloud blocks: `aws-profile`, `azure-subscription`, `gcp-project`, `kubernetes-context` — each with elements, zen/minimal/extended templates
- [x] 3.3 Add status blocks: `jobs`, `cmd-duration` — each with elements, zen/minimal/extended templates

## 4. Category Ordering

- [x] 4.1 Add `CATEGORY_ORDER` array to registry: essential, git, status, environment, cloud
- [x] 4.2 Update `getBlocksByCategoryForSurface()` to return categories in defined order
- [x] 4.3 Add "environment" and "cloud" labels to `CATEGORY_LABELS` in `BlockCatalog.tsx`
- [x] 4.4 Update `BlockCatalog.tsx` to use category ordering from registry

## 5. Scenario Data

- [x] 5.1 Create `src/lib/scenarios.ts` with `ScenarioPreset` type (id, name, surfaceId, data: ScenarioData)
- [x] 5.2 Add 5 scenario presets for terminal-prompt: "Home Directory", "Git Repository", "Node Project", "Python Project", "Error State"
- [x] 5.3 Export `SCENARIOS` array and `getScenariosBySurfaceId()` helper

## 6. Rendering Pipeline — Emit Stage

- [x] 6.1 Create `src/lib/renderer.ts` with `emitElements(block, scenarioData)` — resolves each element definition against scenario, returns `Record<string, ResolvedElement>`
- [x] 6.2 Handle element source resolution (scenario field lookup), static values, format templates (`{}` replacement), and flag-type formats (show format string if source is truthy, empty if falsy)
- [x] 6.3 Handle theme slot inheritance (element.themeSlot ?? block.themeSlot)

## 7. Rendering Pipeline — Select Stage

- [x] 7.1 Add `selectSpans(styleTemplate, resolvedElements)` — parses template, produces ordered spans preserving element boundaries and theme slots
- [x] 7.2 Handle empty element collapsing — omit spans for empty elements and collapse adjacent literal spaces
- [x] 7.3 Compute block visibility — block is not visible when all source-based elements resolved to empty text

## 8. Rendering Pipeline — Arrange Stage

- [x] 8.1 Add `arrangePlain(blockSpans[], config)` — concatenates block spans with gap spans between visible blocks
- [x] 8.2 Add `arrangeFlow(blockSpans[], config)` — prepends connector elements (with fg: "muted") to each block's content
- [x] 8.3 Add `arrangeBrackets(blockSpans[], config)` — wraps each visible block in open/close bracket spans (with fg: "border")
- [x] 8.4 Add `arrangePowerline(blockSpans[], config)` — sets bg to block themeSlot, fg to "auto-contrast" for all content, inserts separator glyphs with fg=prev/bg=next
- [x] 8.5 Add `arrangePowertab(blockSpans[], config)` — icon elements get block bg + auto-contrast fg, content elements get per-element fg + default bg, separator glyphs transition between regions
- [x] 8.6 Add `arrangeZone(blockSpans[], layout)` — dispatcher that calls the correct layout arranger based on layout type

## 9. Rendering Pipeline — Paint Stage

- [x] 9.1 Add `paintSpans(renderSpans[], theme)` — resolves semantic color refs (theme slot names, "muted", "border") to concrete CSS color values
- [x] 9.2 Handle auto-contrast — resolve bg first, then compute sufficient-contrast fg
- [x] 9.3 Handle sub-slot fallback — if theme doesn't define "vcs-ahead", fall back to "vcs"

## 10. Theme Sub-slots

- [x] 10.1 Add sub-slot definitions to theme presets in `themes.ts` — vcs-ahead, vcs-behind, vcs-dirty at minimum
- [x] 10.2 Update theme resolution to support parent fallback for undefined sub-slots

## 11. Surface Updates

- [x] 11.1 Add default `ZoneLayout` (plain, gap: " ") to terminal-prompt surface zone definitions
- [x] 11.2 Update `SurfaceConfig` zone entries to include optional layout override

## 12. Fix Downstream Consumers

- [x] 12.1 Update `ZoneEditor.tsx` to work with new BlockDefinition shape (element templates instead of StylePreset objects)
- [x] 12.2 Update `BlockCatalog.tsx` handleAdd to use new block definition shape
- [x] 12.3 Update any other components referencing old StylePreset or format/icon fields

## 13. Zone Layout UI

- [x] 13.1 Add zone layout picker to `ZoneEditor.tsx` — dropdown with plain/flow/brackets/powerline/powertab options
- [x] 13.2 Add "apply to all zones" option when changing layout
- [x] 13.3 Add layout-specific config UI (brackets: open/close/padding, powerline: separator/terminator glyphs)
- [x] 13.4 Add SET_ZONE_LAYOUT action to composer reducer, storing layout in SurfaceConfig
- [x] 13.5 Update persistence to save/load zone layout config
