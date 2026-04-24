## 1. Types and Scenario Data

- [x] 1.1 Add `TargetHook` interface (`preExec: string[]`, `promptLocal: string[]`) and `targetHooks?: Partial<Record<TargetId, TargetHook>>` to `BlockDefinition` in `src/lib/types.ts`
- [x] 1.2 Extend `ScenarioData` in `src/lib/types.ts` with new fields: `shell`, `os`, `battery`, `memUsage`, `diskUsage`, `isSudo`, `deleted`, `renamed`, `linesAdded`, `linesRemoved`, per-language target version fields (`nodeTargetVersion`, `pythonTargetVersion`, `rubyTargetVersion`, `golangTargetVersion`, `rustTargetVersion`, `javaTargetVersion`, `kotlinVersion`, `kotlinTargetVersion`, `scalaVersion`, `scalaTargetVersion`, `dotnetVersion`, `dotnetTargetVersion`, `phpVersion`, `phpTargetVersion`, `luaVersion`, `luaTargetVersion`, `swiftVersion`, `swiftTargetVersion`, `dartVersion`, `dartTargetVersion`, `elixirVersion`, `elixirTargetVersion`), and cloud fields (`dockerContext`, `helmChart`, `terraformWorkspace`, `pulumiStack`)
- [x] 1.3 Update `src/lib/data/scenarios.ts` — revise existing presets to use new field names and add presets exercising `isSudo`, `battery`, `memUsage`, `dockerContext`, and at least one language `compare` preset (version + target version)

## 2. Block Registry Rewrite

- [x] 2.1 Refactor `makeEnvVersionBlock` → `makeLanguageBlock` in `src/lib/data/blocks.ts`: update factory to emit presets `minimal`, `compare`, `extended`, `max`; add `targetField` parameter (e.g. `nodeTargetVersion`) for the `compare`/`max` presets
- [x] 2.2 Refactor `makeCloudBlock` in `src/lib/data/blocks.ts`: change preset from `zen`/`minimal`/`extended` to single `default` preset
- [x] 2.3 Replace `user` and `host` blocks with unified `session` block: implement composite `userAtHost` capture (returns `user@host` / `user` / `host` / `""` based on what's present); define 7 presets: `user-only`, `host-only`, `shell-only`, `os-only`, `user@host`, `shell+os`, `all`
- [x] 2.4 Replace `cwd` block: rename presets to `absolute`, `tilde`, `short-3`, `short-5`
- [x] 2.5 Replace `git-branch` + `git-status` with unified `git` block: add captures for `deleted`, `renamed`, `linesAdded`, `linesRemoved`; define 4 presets: `minimal`, `medium`, `full`, `max`
- [x] 2.6 Replace `exit-code` + `cmd-duration` with unified `last-command` block: define 4 presets: `icon-only`, `exitcode-only`, `duration-only`, `code+duration`; add `targetHooks` with `bash-ps1` and `powershell-prompt` entries that declare exit-capture and timer setup in `preExec` / `promptLocal`
- [x] 2.7 Replace `time` block with `clock` block: add `battery` capture; define 4 presets: `time-only`, `battery-icon`, `battery-pct`, `full`
- [x] 2.8 Rename `jobs` presets from `zen`/`minimal`/`extended` to `minimal`/`extended`; keep captures unchanged
- [x] 2.9 Add `sudo` block: single `isSudo` capture; 2 presets: `icon`, `text`
- [x] 2.10 Add `sysinfo` block: captures for `memUsage` and `diskUsage`; 3 presets: `mem-only`, `mem+disk`, `full`
- [x] 2.11 Add remaining 8 language blocks via `makeLanguageBlock`: `kotlin`, `scala`, `dotnet`, `php`, `lua`, `swift`, `dart`, `elixir` — each with correct icon, scenario fields (version + target version), and shell commands
- [x] 2.12 Add remaining 4 cloud blocks via `makeCloudBlock`: `docker`, `helm`, `terraform`, `pulumi` — each with correct icon, scenario field, and shell commands
- [x] 2.13 Update `CATEGORY_ORDER` to `["essential", "vcs", "status", "language", "cloud"]`

## 3. Exporters

- [x] 3.1 Update Bash exporter to walk `targetHooks["bash-ps1"]` for each active block and emit `preExec` lines into `PROMPT_COMMAND` setup and `promptLocal` lines into `_tt_build_prompt` — remove any existing block-ID checks for exit/timer logic
- [x] 3.2 Update PowerShell exporter the same way for `targetHooks["powershell-prompt"]`

## 4. Persistence Validation

- [x] 4.1 In the config loader (wherever localStorage configs and imported base64 strings are parsed), validate every `BlockInstance.blockId` against `getBlockById`; if any ID is unknown, discard the config and return the surface default config

## 5. Fixture Regeneration

- [x] 5.1 Delete all files in `src/lib/exporters/__fixtures__/`
- [x] 5.2 Run exporter tests in snapshot-update mode to regenerate fixtures for all new block IDs and preset names: `pnpm test -- --update-snapshots` (or equivalent flag for the test runner in use)
- [x] 5.3 Spot-check a few regenerated files (e.g. `bash__git__minimal__plain.txt`, `bash__session__user@host__plain.txt`, `bash__last-command__code+duration__plain.txt`) to confirm correct content including lifecycle hook output

## 6. Downstream Fixes

- [x] 6.1 Search for any hardcoded block IDs in components (`BlockCatalog.tsx`, `ZoneEditor.tsx`, `ComposerProvider.tsx`, `blockHelpers.ts`) and update to new IDs
- [x] 6.2 Check `src/lib/data/surfaces.ts` default zone layout — if it references specific block IDs in default config, update them
- [x] 6.3 Run `pnpm build` (or `pnpm typecheck`) and resolve any TypeScript errors from the type changes
- [x] 6.4 Run full test suite (`pnpm test`) and confirm all tests pass with regenerated fixtures
