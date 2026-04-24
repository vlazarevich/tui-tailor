## Why

The current block registry was built incrementally and diverges from the canonical BLOCKS.md catalog in block names, category names, preset names, and block count (19 vs 30). Since the app is pre-launch, this is the right moment to do a clean alignment.

## What Changes

- **BREAKING**: All block IDs renamed to match BLOCKS.md (`git-branch` → `git`, `exit-code`+`cmd-duration` → `last-command`, `user`+`host` → `session`, etc.)
- **BREAKING**: All style preset names replaced with BLOCKS.md-defined names (e.g. `zen`/`minimal`/`extended` → `minimal`/`medium`/`full`/`max` for git; per-block naming throughout)
- **BREAKING**: Category names updated: `git` → `vcs`, `environment` → `language`
- Blocks `user` and `host` collapsed into a single `session` block with 7 presets
- Blocks `git-branch` and `git-status` collapsed into a single `git` block with 4 presets
- Blocks `exit-code` and `cmd-duration` collapsed into a single `last-command` block with 4 presets
- Block `time` replaced by `clock` (adds battery presets)
- 8 new language blocks added: `kotlin`, `scala`, `dotnet`, `php`, `lua`, `swift`, `dart`, `elixir`
- 4 new cloud blocks added: `docker`, `helm`, `terraform`, `pulumi`
- 2 new status blocks added: `sudo`, `sysinfo`
- `BlockDefinition` gains optional target lifecycle hooks so blocks like `last-command` can declare shell-level setup without exporter-side block ID checks
- `ScenarioData` extended with new fields including per-language target version fields (needed for `compare`/`max` presets)
- Persisted/imported configs with unknown or legacy block IDs are rejected and reset to a valid default
- All 132 exporter fixture files renamed and regenerated to match new block IDs and preset names

## Capabilities

### New Capabilities

None — all changes are modifications to existing capabilities.

### Modified Capabilities

- `block-registry`: Requirements change for block count (19→30), category names (`git`→`vcs`, `environment`→`language`), data model (session composite capture, unified git/last-command), and target lifecycle hooks on `BlockDefinition`
- `block-rendering`: Style preset names change throughout; `ScenarioData` extended with target version fields and other new fields
- `bash-ps1-exporter`: Exporter consumes lifecycle hooks generically; all fixture files regenerated
- `powershell-exporter`: Same as above
- `persistence`: Configs with unknown/legacy block IDs are rejected and reset on load

## Impact

- `src/lib/types.ts` — `ScenarioData`: ~25 new fields; `BlockDefinition`: optional `targetHooks` map
- `src/lib/data/blocks.ts` — complete rewrite; factories refactored for new preset names
- `src/lib/data/scenarios.ts` — updated presets to exercise new fields
- `src/lib/exporters/` — Bash and PowerShell exporters consume lifecycle hooks; no per-block-ID branches
- `src/lib/exporters/__fixtures__/` — all 132 files deleted and regenerated
- `src/lib/ComposerProvider.tsx` (or persistence layer) — reject/reset configs with unknown block IDs
- Downstream component references to old block IDs (BlockCatalog, ZoneEditor) may need updating if they hard-code IDs
