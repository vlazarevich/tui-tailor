## 1. Type Model

- [x] 1.1 Add `optional?: boolean` to `ZoneDefinition` in `types.ts`
- [x] 1.2 Add `enabled?: boolean` to `ZoneConfig` in `types.ts`
- [x] 1.3 Add `multilineCommand?: boolean` to `ScenarioData` in `types.ts`

## 2. Surface and Scenario Data

- [x] 2.1 Add `continuation-prompt` zone (optional) to terminal surface in `surfaces.ts`
- [x] 2.2 Mark `right-prompt` and `continuation-prompt` as `optional: true` in `surfaces.ts`
- [x] 2.3 Add multiline-command scenario preset to `scenarios.ts`

## 3. App Shell Layout Restructure

- [x] 3.1 Add full-height right export column to `AppShell.tsx`
- [x] 3.2 Split center column into top (zone editors) and bottom (preview) flex sections, each independently scrollable
- [x] 3.3 Move `ConfigShare` into new `ExportPanel.tsx` component (placeholder output for now)

## 4. Zone Editor — Tags

- [x] 4.1 Create `BlockTag.tsx`: renders a single block tag (gear icon, colored name, muted style, `bg-surface-elevated`)
- [x] 4.2 Create `BlockPopup.tsx`: popup with style list, ← → reorder, "move to" zone list, × remove; dismisses on outside click
- [x] 4.3 Rewrite `ZoneEditor.tsx` to render `BlockTag` list with wrapping, full line-height padding; remove inline expand logic
- [x] 4.4 Wire gear icon click in `BlockTag` to open `BlockPopup` anchored to the tag
- [x] 4.5 Implement ← → reorder dispatch in popup (reuse existing `REORDER_BLOCK` action)
- [x] 4.6 Implement zone-transfer dispatch in popup (new `MOVE_BLOCK_TO_ZONE` action in `composerContext`)
- [x] 4.7 Hide "move to" section in popup when only one zone is enabled

## 5. Optional Zone Controls

- [x] 5.1 Update `Canvas.tsx` to only render zones where `enabled !== false` (for optional zones)
- [x] 5.2 Add `+` buttons below active zones in `Canvas.tsx` for each disabled optional zone
- [x] 5.3 Add `×` control to optional zone headers in `ZoneEditor.tsx`
- [x] 5.4 Dispatch `ENABLE_ZONE` / `DISABLE_ZONE` actions from canvas and zone editor (add to `composerContext`)

## 6. Live Preview Pane

- [x] 6.1 Create `PreviewPane.tsx`: reads surface, config, and theme from context; renders stacked scenario rows
- [x] 6.2 Implement single scenario row: fixed-width label, left-prompt spans, right-prompt spans (`justify-between`), `whitespace-nowrap overflow-x-auto`
- [x] 6.3 Implement multiline rendering: right-prompt on line 1, prompt-char on line 2 when `globalOptions.multiline` is true
- [x] 6.4 Implement single-line rendering: left-prompt + prompt-char, right-prompt right-aligned
- [x] 6.5 Implement continuation zone row: only renders when `scenario.data.multilineCommand` is true and continuation zone is enabled
- [x] 6.6 Add empty spacer row between scenarios
- [x] 6.7 Wire `PreviewPane` into the bottom section of the center column in `AppShell.tsx`
