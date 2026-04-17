## Why

The app can compose and preview prompts but has no way to use them — users hit a dead end. Bash and PowerShell are the two most common shell environments, covering the vast majority of terminal-prompt users, making them the right first export targets.

## What Changes

- Add `bash-ps1` and `powershell-prompt` export targets for the `terminal-prompt` surface
- Extend `BlockDefinition` with `exportCosts: Record<ExportTargetId, number>` — per-block cost per target (0=native, 100=not feasible)
- Extend `ExportTarget` type with `blockCosts` and `zoneCosts` maps
- Replace the ExportPanel "coming soon" placeholder with a functional export UI
- Generate truecolor ANSI output (no 256-color fallback)
- Powerline/powertab layouts emit a Nerd Font requirement comment in generated code
- Right-prompt zone gets cost=75 for `bash-ps1` (cursor-positioning hack, fragile) and cost=0 for `powershell-prompt`

## Capabilities

### New Capabilities

- `export-targets`: Definition of export targets, cost model schema (block-level and zone-level costs), and target registry
- `bash-ps1-exporter`: Code generator for `bash-ps1` — produces `PROMPT_COMMAND` builder function + truecolor color variables section
- `powershell-exporter`: Code generator for `powershell-prompt` — produces `function Prompt {}` + truecolor color variables section
- `export-panel`: Export UI — tabbed by target, scrollable code view with labeled sections, per-section Copy and Copy All actions

### Modified Capabilities

- `block-registry`: Each block gains `exportCosts` field

## Impact

- `src/lib/types.ts`: extend `BlockDefinition`, `ExportTarget`
- `src/lib/registry.ts`: add `exportCosts` to all existing blocks
- `src/lib/exporters/` (new): `bash.ts`, `powershell.ts`, `index.ts`
- `src/components/ExportPanel.tsx`: replace placeholder with full UI
- No new dependencies
