## Context

The block registry currently has 19 blocks across 5 categories, built incrementally without a unified spec. Block IDs, category names, and style preset names all diverge from the canonical BLOCKS.md catalog. Since the app is pre-launch, this change does a full alignment: 30 blocks, correct IDs, correct preset names, correct categories.

Current state: `src/lib/data/blocks.ts` defines blocks using two factory functions (`makeEnvVersionBlock`, `makeCloudBlock`) for the repetitive language/cloud shapes, and 8 manually-written blocks.

The rendering pipeline already handles empty capture values correctly — `selectSpans` skips empty elements and `collapseSpaces` removes orphan whitespace. This means conditional block fields (e.g. `session`'s optional `shell`/`os`) work naturally via empty capture values.

## Goals / Non-Goals

**Goals:**
- Replace all 19 existing blocks with 30 blocks exactly matching BLOCKS.md
- Replace all preset names with BLOCKS.md-defined names (per block)
- Rename categories: `git` → `vcs`, `environment` → `language`
- Extend `ScenarioData` with ~10 new fields for new blocks
- Regenerate all 132 exporter fixture files

**Non-Goals:**
- Changing the rendering pipeline (emit/select/arrange/paint stays intact)
- Adding new zone layouts
- Changes to persistence or export formats beyond block ID/preset references
- Supporting non-terminal-prompt surfaces in this change

## Decisions

### Decision 1: Composite captures for session's user@host preset

`session` needs `viktor@thinkpad` where `@` only appears when both user and host are present. The current template system collapses whitespace but not arbitrary punctuation.

**Chosen**: Composite capture — define a `userAtHost` capture whose scenario function returns `${user}@${host}` when both are present, `${user}` when host is absent, `${host}` when user is absent, and `""` otherwise. The bash/pwsh binding handles the same logic.

**Rejected alternative**: Modify `collapseSpaces` to handle connector-role elements specially. This would be a renderer change and adds complexity for a single edge case. If more blocks need this pattern in future, revisit.

### Decision 2: Retain and extend factory functions

`makeEnvVersionBlock` and `makeCloudBlock` already cover the repetitive shapes. They need refactoring:

- Rename to `makeLanguageBlock` — new presets: `minimal`, `compare`, `extended`, `max` (vs old `zen`/`minimal`/`extended`). Add `compare` preset which renders `{icon} {version} → {target}` where `target` is an optional second capture.
- `makeCloudBlock` — stays conceptually similar; preset becomes `default` only (single preset as per BLOCKS.md).

This covers 14 language + 8 cloud = 22 of 30 blocks via factories.

### Decision 3: Target lifecycle hooks on BlockDefinition

`last-command` needs shell-level setup that runs before the prompt function: capture the previous exit code and start/stop a command timer. Currently the Bash and PowerShell exporters check for the literal block ID `"last-command"` (or similar legacy IDs) to inject this setup. That coupling means every new lifecycle-sensitive block requires an exporter change.

**Chosen**: Add an optional `targetHooks: Partial<Record<TargetId, TargetHook>>` field to `BlockDefinition`. A `TargetHook` carries `preExec: string[]` (lines injected into the shell's pre-execution hook, e.g. `PROMPT_COMMAND` prelude) and `promptLocal: string[]` (lines run inside `_tt_build_prompt` before captures are evaluated). Exporters walk hooks the same way they walk captures — no block-ID checks.

`last-command`'s bash hook would declare the `$_last_exit` capture and `$_cmd_ms` timer setup in `preExec`; the capture bindings then reference those variables normally.

**Rejected alternative**: Keep block-ID checks in the exporter. Rejected because it creates permanent coupling and makes the pattern non-obvious for future blocks (e.g. a `sysinfo` block that caches expensive `free`/`df` calls).

### Decision 4: Language blocks use `minimal`/`compare`/`extended`/`max` with simplified captures

BLOCKS.md language presets: `minimal` (version only), `compare` (version + target), `extended` (version + pkg manager + venv + framework), `max` (extended + target). For the initial implementation:

- `minimal` and `compare` are fully implemented (version + optional target captures).
- `extended` and `max` collapse to `minimal`/`compare` in the preview (pkg manager / framework detection require filesystem analysis, not available in the browser scenario model). The style templates are defined but the extra captures always resolve to empty in the scenario — the renderer hides them correctly.
- Export-side: same — the captures are defined with shell commands but the guard ensures they only appear when the value is non-empty.

This means the block is future-proof: when pkg manager / framework detection is added to ScenarioData later, the templates already handle it.

### Decision 5: git block unification

Current `git-branch` + `git-status` → single `git` block with 4 presets:
- `minimal`: `{icon} {branch} {dirty}`
- `medium`: `{icon} {branch} {ahead}{behind} {dirty}`
- `full`: `{icon} {branch} {ahead}{behind} {staged}{unstaged}{deleted}{renamed}{untracked}`
- `max`: `{icon} {branch} {ahead}{behind} {staged}{unstaged}{deleted}{renamed}{untracked} {linesAdded}{linesSep}{linesRemoved}`

`deleted` and `renamed` are new captures (BLOCKS.md `-N` and `»N`). `linesAdded`/`linesRemoved` are new captures for `max`. These all need new `ScenarioData` fields.

### Decision 6: last-command unification

`exit-code` + `cmd-duration` → `last-command` with 4 presets:
- `icon-only`: `{icon}` (shows ✗, only when exit code ≠ 0)
- `exitcode-only`: `{code}`
- `duration-only`: `{duration}`
- `code+duration`: `{icon} {code} · {duration}` (collapseSpaces handles absent code or duration)

The `·` separator between code and duration is a literal in the template. When duration is absent, it becomes trailing whitespace and is trimmed by `collapseSpaces`. When code is absent (success), `{icon} {code}` collapses to empty and the block hides if duration is also absent.

### Decision 7: Persistence validation — reject unknown block IDs

When the app loads a config from localStorage or imports a shared config string, it must validate block IDs against the registry. With the catalog fully replaced, any config referencing old IDs (`git-branch`, `node-version`, etc.) is irrecoverably stale. Rather than silently dropping unknown blocks, the loader rejects the entire config and falls back to a fresh default for the surface.

**Chosen**: Validate each `BlockInstance.blockId` in a loaded `SurfaceConfig` against `getBlockById`. If any ID is unknown, discard the config and return the default surface config. Log a console warning.

**Rejected alternative**: Strip only the unknown blocks and keep the rest. Rejected because partial configs with missing blocks would silently produce a degraded layout that looks like a bug rather than a clean reset.

### Decision 8: Fixture regeneration via test runner

The 132 fixture files embed block IDs and preset names in their filenames. With all IDs and presets changing, regeneration is simplest: delete all files in `__fixtures__/`, run the exporter test suite in `--update-snapshots` mode (or equivalent), and commit the new files. This is faster than scripted renaming since the content changes too (new block shell code).

## Risks / Trade-offs

- **Saved localStorage configs break** → Acceptable; app is pre-launch. First-load will fail to find block IDs and reset to defaults.
- **`compare` preset shows `→ target` even when installed == target** → By spec: "Target portion hidden when versions match exactly". The scenario function handles this: if `installed === target`, return `""`. The template collapses cleanly.
- **`extended`/`max` language presets show nothing extra in preview** → Acceptable. The template structure is correct; data just isn't wired yet. Blocks degrade cleanly to `minimal`/`compare` appearance.
- **`@` in user@host export** → The bash binding for `userAtHost` must replicate the same conditional logic as the scenario function. Needs careful implementation to avoid literal `@` appearing when only one of user/host is set.
