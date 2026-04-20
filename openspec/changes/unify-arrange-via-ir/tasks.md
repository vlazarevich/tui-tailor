## 1. Extract IR and arrange into `compose/`

- [ ] 1.1 Create `src/lib/compose/ir.ts`. Move `RenderSpan`, `BlockSpans`, and related types here. Re-export from `renderer.ts` for now.
- [ ] 1.2 Create `src/lib/compose/arrange.ts`. Move `arrangePlain`, `arrangeFlow`, `arrangeBrackets`, `arrangePowerline`, `arrangePowertab`, and `arrangeZone` here, verbatim.
- [ ] 1.3 Extend arrange output with `blockBoundaries: Array<{ blockIndex, start, end, guard?: string }>` — mapping each span range back to the block instance that produced it, with that block's AND-of-guards string (if any).
- [ ] 1.4 `renderer.ts` imports arrange from compose; preview output unchanged.

## 2. Teach Bash exporter to paint IR

- [ ] 2.1 Add `BashTarget.paintSpan(span, theme)` and `BashTarget.joinZone(painted)`.
- [ ] 2.2 Implement a new `exportBashViaIR` path: for each zone, call `arrangeZone`, walk `blockBoundaries` to wrap span groups in `emitConditional`, paint remaining spans with `paintSpan`, join with `joinZone`.
- [ ] 2.3 Gate with a `USE_NEW_ARRANGE` constant; old `generatePowerline*` paths still reachable for comparison.

## 3. Flip Bash to IR path

- [ ] 3.1 Snapshot current Bash export output for golden fixtures (covers plain, flow, brackets, powerline with 1/2/3/5 blocks, powertab).
- [ ] 3.2 Flip `USE_NEW_ARRANGE`. Diff against fixtures.
- [ ] 3.3 Resolve diffs. Expected category: previously-dropped blocks (git-status, jobs, cloud, etc.) now appear in powerline output. Unexpected diffs are bugs to fix.
- [ ] 3.4 Delete `generatePowerlineZoneCode`, `generatePowertabZoneCode`, `generatePowerlineBlockContent` from `bash.ts`. Delete the `USE_NEW_ARRANGE` constant.

## 4. Do the same for PowerShell

- [ ] 4.1 Add `PowerShellTarget.paintSpan` / `joinZone`.
- [ ] 4.2 Route PowerShell export through `compose/arrange`.
- [ ] 4.3 Diff against golden fixtures. Resolve.
- [ ] 4.4 Delete any zone-layout code left in `powershell.ts`.

## 5. Missing-binding warnings

- [ ] 5.1 Extend exporter result with `warnings: Array<{ blockId: string; blockName: string; reason: string }>`.
- [ ] 5.2 Emit a warning when a block's capture is missing a binding for the active target; omit the block from output.
- [ ] 5.3 Update `ExportPopup.tsx` to render these warnings in the existing warnings row.
- [ ] 5.4 Add a scenario to the export-panel UI: a block with a missing binding shows its warning, and the code output correctly omits the block.

## 6. Verify

- [ ] 6.1 Manual: add every block (including those previously missing from powerline) to a powerline zone. Confirm preview == export.
- [ ] 6.2 Manual: add every block to a powertab zone. Same check.
- [ ] 6.3 Search `src/lib/exporters/` for any remaining layout-specific function names; confirm none exist.
- [ ] 6.4 Confirm preview continues to render unchanged across all packaged themes × scenarios.
