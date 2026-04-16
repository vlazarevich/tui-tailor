## Context

The renderer pipeline (emit → select → arrange → paint) is complete and returns `PaintedSpan[]`. Scenario presets exist in `scenarios.ts`. The current app shell has two columns (catalog left, canvas center) with no preview or export area. The zone editor is a full-width block list with inline expand/collapse for style selection.

## Goals / Non-Goals

**Goals:**
- Add a live preview pane that renders the current config against all scenario presets simultaneously
- Restructure the app shell into a three-column layout with a vertical split in the center column
- Redesign the zone editor to use tags with a popup, replacing the inline expand pattern
- Introduce optional zones with hidden-by-default UX
- Add continuation prompt zone and multiline-command scenario to the terminal surface
- Keep preview purely derived from context — no local state beyond scroll position

**Non-Goals:**
- Drag-and-drop block reordering (reserved; gear icon keeps click area available for future drag handle)
- Export generators (Bash PS1, PowerShell) — covered in a subsequent change
- Transient prompt zone
- Custom/user-defined scenarios

## Decisions

### D1: Preview is purely derived — no local state

`PreviewPane` reads `activeSurfaceId`, `activeConfig`, and `themeId` from `ComposerContext`. It calls `getScenariosBySurfaceId` and `renderZone` inline. No local state except scroll position. This means preview updates synchronously on every state change — no debounce needed since `renderZone` is a pure synchronous function.

*Alternative considered*: caching painted spans in a ref and only recomputing on change. Rejected — premature optimization; the pipeline is cheap for the block counts we have.

### D2: Preview layout — stacked rows with fixed-width scenario label

Each scenario renders as one entry in a vertical stack. Scenario name is a fixed-width muted left column (`w-[12ch]`). Left and right prompt are laid out with `justify-between` in a flex row. Content is `whitespace-nowrap` with `overflow-x: auto` — no wrapping, horizontal scroll if a prompt is very long.

For multiline prompts (`globalOptions.multiline === true`): right prompt appears on line 1 alongside the block content; prompt-char (`globalOptions["prompt-char"]`) appears on line 2 indented to align with content. The prompt-char is added by `PreviewPane`, not by any zone block.

Continuation zone only renders in scenarios where `scenario.data.multilineCommand === true`.

Empty spacer row (one line height) between scenarios.

*Alternative considered*: tabs or a scenario selector showing one scenario at a time. Rejected — simultaneous view is the primary value; users need to see all contexts at once to trust their composition.

### D3: App shell layout — three columns, vertical center split

```
┌──────────────────────────────────────────────────────┐
│ toolbar                                              │
├──────────┬────────────────────────┬──────────────────┤
│          │ zone editors (flex-1)  │                  │
│ catalog  ├────────────────────────┤  export panel    │
│ (fixed)  │ preview (flex-1)       │  (fixed width)   │
└──────────┴────────────────────────┴──────────────────┘
```

Center column is a flex column; zone editors and preview each take `flex-1` with `overflow-y-auto` independently. Export panel is fixed width (right column), full height.

`ConfigShare` component is retired; its logic moves into `ExportPanel`.

### D4: Zone editor tags — gear icon as explicit popup trigger

Each block renders as a compact tag: colored text (`text-semantic-{themeSlot}`), subtle bg (`bg-surface-elevated`), block name, active style in muted text, gear icon on right. Example: `[⚙ git-branch · minimal]`.

Gear icon opens a popup anchored to the tag. Popup contains: style list (radio-style selection), ← → reorder buttons, "move to →" zone list (only when other enabled zones exist), and × remove. Clicking outside dismisses.

Gear icon is the explicit trigger (not clicking the tag body) to keep the tag body available for future drag-and-drop without a UX change.

*Alternative considered*: clicking the tag opens popup, × on hover for removal. Rejected — would conflict with drag-and-drop when added later.

### D5: Optional zones — hidden when disabled, `+` to enable

`ZoneDefinition` gains `optional?: boolean`. `ZoneConfig` gains `enabled?: boolean` (absent/true = enabled). Disabled optional zones are not rendered in the editor. Below all active zones, `+` buttons appear for each disabled optional zone. Active optional zones have an `×` in their header to disable them.

The canvas checks `config.zones[zone.id]?.enabled !== false` to determine visibility. Required zones are always rendered regardless of config state.

*Alternative considered*: always-visible collapsed headers for disabled zones. Rejected — adds visual noise; optional zones should not compete with required ones for attention.

### D6: Type model changes

```ts
// ZoneDefinition
optional?: boolean  // undefined/false = required

// ZoneConfig
enabled?: boolean   // undefined/true = enabled, false = disabled

// ScenarioData
multilineCommand?: boolean
```

Persistence migration: `loadSurfaceConfig` already handles array→object migration for zones. No additional migration needed — `enabled` absent is treated as `true` by the canvas.

## Risks / Trade-offs

- **Preview width vs prompt length**: Wide powerline prompts may require horizontal scroll. The `overflow-x: auto` per row means right prompt can scroll off. Acceptable — mirrors real terminal behavior.
- **Popup positioning**: Simple absolute anchoring to tag. On narrow panels, popup may clip at panel edge. Mitigated by keeping popup compact; full positioning logic deferred.
- **Tag wrapping**: If a zone has many blocks, tags wrap to multiple lines. This is correct behavior and requires no special handling.

## Open Questions

- Export panel content: placeholder or live export output? (Covered in next change — placeholder for now.)
