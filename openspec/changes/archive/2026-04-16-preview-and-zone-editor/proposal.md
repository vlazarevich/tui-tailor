## Why

M1 delivered the block registry, renderer pipeline, and app shell, but the composer is not yet usable: there is no live preview (users compose blindly), the zone editor is cramped and awkward, and the layout has no place for export output. This change completes the M2 interaction loop — compose, see, export.

## What Changes

- **Live preview pane** added below the zone editors in the center column, showing the rendered prompt across all surface scenarios simultaneously (stacked rows, scrollable).
- **Export panel** added as a full-height right column, replacing the current inline `ConfigShare` component.
- **Zone editor redesigned** from a full-width block list to a compact tag-based layout with a popup for per-block settings (style, reorder, zone transfer).
- **Optional zones** introduced: zones can be marked required or optional; optional zones are hidden until enabled by the user.
- **Continuation prompt zone** added to the terminal surface (optional), renders only in multiline-command scenarios.
- **`ScenarioData`** gains `multilineCommand?: boolean`; a multiline-command scenario preset added.
- **Type model updated**: `ZoneDefinition` gains `optional?: boolean`; `ZoneConfig` gains `enabled?: boolean`.

## Capabilities

### New Capabilities

- `live-preview`: Readonly pane rendering the active surface config across all scenario presets simultaneously. Stacked rows, scrollable. Left and right prompt on same line. Multiline prompt support. Continuation zone renders only in multiline scenarios.
- `zone-editor-tags`: Redesigned zone editor using a tag-based block list. Tags are colored by theme slot, show block name and active style. Gear icon opens a popup for style selection, left/right reorder, zone transfer, and removal. Optional zones are hidden when disabled; enabled via `+` buttons below active zones, disabled via `×` in zone header.

### Modified Capabilities

- `app-shell`: Layout changes — center column splits vertically (zone editors top, preview bottom); export moves to a new full-height right column.
- `persistence`: `ZoneConfig` gains `enabled?: boolean`. Migration needed for existing saved configs (absent = enabled).

## Impact

- `src/components/AppShell.tsx` — layout restructure (three columns, vertical center split)
- `src/components/ZoneEditor.tsx` — full rewrite to tag + popup design
- `src/components/Canvas.tsx` — optional zone visibility, `+`/`×` controls
- `src/components/ConfigShare.tsx` — moved into new export panel component
- `src/lib/types.ts` — `ZoneDefinition.optional`, `ZoneConfig.enabled`, `ScenarioData.multilineCommand`
- `src/lib/surfaces.ts` — continuation prompt zone added to terminal surface
- `src/lib/scenarios.ts` — multiline-command scenario added
- `src/lib/persistence.ts` — migration for `ZoneConfig.enabled`
- New: `src/components/PreviewPane.tsx`, `src/components/ExportPanel.tsx`, `src/components/BlockTag.tsx`, `src/components/BlockPopup.tsx`
