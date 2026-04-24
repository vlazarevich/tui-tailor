## MODIFIED Requirements

### Requirement: Block definition schema
Each block in the registry SHALL have: a unique string ID, a display name, a category, a list of compatible surface IDs, a named elements map (each element with role, source or value, optional format, and optional themeSlot), a primary themeSlot for the block, style presets as element template strings, and a default style preset name.

#### Scenario: Block definition is complete
- **WHEN** a block is defined in the registry
- **THEN** it has all required fields: id, name, category, surfaces, elements (with at least one content-role element), themeSlot, styles (with at least one preset as a template string), and defaultStyle

#### Scenario: Element definition is valid
- **WHEN** a block defines an element
- **THEN** the element has a name, a role (content, icon, or connector), and either a source field or a value field

### Requirement: Block definition schema includes optional target lifecycle hooks
`BlockDefinition` MAY include a `targetHooks: Partial<Record<TargetId, TargetHook>>` field. A `TargetHook` SHALL carry `preExec: string[]` (lines injected into the shell's pre-execution hook, before the prompt function runs) and `promptLocal: string[]` (lines run at the top of the prompt builder function, before captures are evaluated). Exporters SHALL walk hooks generically and MUST NOT check for specific block IDs to decide whether to emit lifecycle code.

#### Scenario: last-command declares a bash lifecycle hook
- **WHEN** the `last-command` block is retrieved
- **THEN** its `targetHooks["bash-ps1"].preExec` contains the lines that capture `$_last_exit` and start the command timer
- **AND** `promptLocal` contains lines that compute `$_cmd_ms` from the timer

#### Scenario: Block without hooks has no effect on export
- **WHEN** a block does not define `targetHooks`
- **THEN** the exporter emits no additional lifecycle code for that block

#### Scenario: Exporter emits hooks without block-ID check
- **WHEN** the Bash exporter processes a config containing `last-command`
- **THEN** it emits the hook lines by reading `targetHooks["bash-ps1"]` from the block definition
- **AND** the exporter source contains no literal string check for `"last-command"`

### Requirement: Block captures carry per-target shell bindings
Each `BlockDefinition` SHALL define a `captures: Record<string, CaptureDefinition>` map. Each capture represents a single piece of data the block needs at render time. A `CaptureDefinition` SHALL provide:
- `scenario: (data: ScenarioData) => string | number | boolean | undefined` — used by the browser preview to read a value from scenario data.
- `targets: Record<TargetId, TargetCaptureBinding>` — per-target bindings where each `TargetCaptureBinding` has `setup: string[]`, `ref: string`, and `guard: string`, all treated as opaque strings in the target's dialect.

#### Scenario: git defines a branch capture
- **WHEN** the `git` block is retrieved from the registry
- **THEN** it defines a capture named `branch` whose `scenario` reads `data.branch`, whose `bash-ps1` binding carries a `setup` that runs `git branch --show-current`, a `ref` of `$_branch`, and a `guard` of `[[ -n "$_branch" ]]`

#### Scenario: Capture binding strings are opaque to shared code
- **WHEN** a capture's `guard` or `setup` string is consumed by the shared compose pipeline
- **THEN** the pipeline passes the string through to the target verbatim without parsing or inspecting its contents

### Requirement: Elements reference captures instead of scenario fields
`ElementDefinition` SHALL support a `capture: string` field that names an entry in the owning block's `captures` map. Elements MAY continue to use `value: string` for static content (icons, connectors, literals). An element MUST NOT mix `capture` and `value`.

#### Scenario: Element references a capture
- **WHEN** the `git` block's `branch` element is defined
- **THEN** it uses `capture: "branch"` and no longer uses a raw `source` field

#### Scenario: Static element unchanged
- **WHEN** a block's `icon` element is defined
- **THEN** it uses `value: "<glyph>"` unchanged and has no `capture` field

### Requirement: Style presets as element templates
Each block's style presets SHALL be template strings referencing element names with `{elementName}` syntax. Templates control which elements are included and their ordering. Preset names SHALL match those defined in BLOCKS.md for each block.

#### Scenario: Style preset defines element selection and order
- **WHEN** the `git` block defines a `minimal` style
- **THEN** the template selects icon, branch, and dirty elements

#### Scenario: Style presets vary element selection
- **WHEN** comparing minimal and max styles for `git`
- **THEN** minimal selects fewer elements while max selects all including line churn

### Requirement: Surface-scoped block filtering
The registry SHALL provide a function to retrieve all blocks compatible with a given surface ID. Only blocks that list the surface in their `surfaces` array SHALL be returned.

#### Scenario: Filter blocks for terminal prompt
- **WHEN** requesting blocks for surface "terminal-prompt"
- **THEN** only blocks with "terminal-prompt" in their surfaces array are returned

#### Scenario: Block compatible with multiple surfaces
- **WHEN** a block lists both "terminal-prompt" and "vim-statusline" in its surfaces
- **THEN** it appears in the results for both surface queries

### Requirement: Category system
Blocks SHALL be organized into categories. The registry SHALL provide a function to group blocks by category for a given surface. Category names SHALL be: `essential`, `vcs`, `status`, `language`, `cloud`.

#### Scenario: Group blocks by category
- **WHEN** requesting categorized blocks for a surface
- **THEN** blocks are returned grouped by their category field
- **AND** categories with no compatible blocks for that surface are omitted

### Requirement: Category ordering
The block catalog SHALL display categories in a defined order: essential, vcs, status, language, cloud.

#### Scenario: Categories render in order
- **WHEN** the block catalog displays categories for terminal-prompt
- **THEN** essential appears before vcs, vcs before status, status before language, language before cloud

### Requirement: Seed data
The registry SHALL include block definitions sufficient for a full terminal prompt experience: 30 blocks across 5 categories (essential, vcs, status, language, cloud).

#### Scenario: App renders with full block catalog
- **WHEN** the app loads
- **THEN** the surface switcher shows at least one surface
- **AND** the block catalog shows exactly 30 blocks in 5 categories

## ADDED Requirements

### Requirement: session block (essential)
The `session` block SHALL show consolidated identity — user, host, shell, OS, any subset. It SHALL define 7 style presets: `user-only`, `host-only`, `shell-only`, `os-only`, `user@host`, `shell+os`, `all`.

#### Scenario: session presets defined
- **WHEN** the `session` block is retrieved
- **THEN** it defines presets: `user-only`, `host-only`, `shell-only`, `os-only`, `user@host`, `shell+os`, `all`
- **AND** `defaultStyle` is `user@host`

#### Scenario: user@host composite capture
- **WHEN** scenario has `user: "viktor"` and `host: "thinkpad"`
- **THEN** the `user@host` preset renders `viktor@thinkpad` with no literal `@` bleeding when either is absent

#### Scenario: user@host with missing host
- **WHEN** scenario has `user: "viktor"` and no `host`
- **THEN** the `user@host` preset renders `viktor` (no trailing `@`)

#### Scenario: all preset collapses absent fields
- **WHEN** scenario has user, host, and os set but no shell
- **THEN** the `all` preset renders user, host, and os with no orphan space where shell would have been

### Requirement: cwd block presets
The `cwd` block SHALL define 4 style presets: `absolute`, `tilde`, `short-3`, `short-5`.

#### Scenario: cwd presets defined
- **WHEN** the `cwd` block is retrieved
- **THEN** it defines presets: `absolute`, `tilde`, `short-3`, `short-5`
- **AND** `defaultStyle` is `tilde`

### Requirement: git block (vcs)
The `git` block SHALL consolidate branch, upstream divergence, working-tree state, and line churn into one block. It SHALL define 4 style presets: `minimal`, `medium`, `full`, `max`.

#### Scenario: git presets defined
- **WHEN** the `git` block is retrieved
- **THEN** it defines presets: `minimal`, `medium`, `full`, `max`
- **AND** `defaultStyle` is `minimal`

#### Scenario: medium preset adds ahead/behind
- **WHEN** preset is `medium` and ahead=2, behind=1
- **THEN** rendered output includes `↑2` and `↓1`

#### Scenario: full preset adds all status counts
- **WHEN** preset is `full` and staged=3, unstaged=2, deleted=1, renamed=1, untracked=4
- **THEN** rendered output includes `+3`, `~2`, `-1`, `»1`, `?4`

#### Scenario: max preset adds line churn
- **WHEN** preset is `max` and linesAdded=142, linesRemoved=37
- **THEN** rendered output includes `+142/-37`

#### Scenario: zero counts collapse
- **WHEN** any count field is 0 or absent
- **THEN** that count is omitted from output (no `↑0`, no `+0`, etc.)

### Requirement: last-command block (status)
The `last-command` block SHALL combine exit code and command duration into one block. It SHALL define 4 style presets: `icon-only`, `exitcode-only`, `duration-only`, `code+duration`.

#### Scenario: last-command presets defined
- **WHEN** the `last-command` block is retrieved
- **THEN** it defines presets: `icon-only`, `exitcode-only`, `duration-only`, `code+duration`
- **AND** `defaultStyle` is `code+duration`

#### Scenario: icon-only hides on success
- **WHEN** exit code is 0 or absent and preset is `icon-only`
- **THEN** block is not visible

#### Scenario: code+duration both absent hides block
- **WHEN** exit code is 0 and cmdDuration is absent and preset is `code+duration`
- **THEN** block is not visible

### Requirement: sudo block (status)
The `sudo` block SHALL show an elevated-privileges indicator. It SHALL define 2 style presets: `icon`, `text`.

#### Scenario: sudo presets defined
- **WHEN** the `sudo` block is retrieved
- **THEN** it defines presets: `icon`, `text`
- **AND** `defaultStyle` is `icon`

#### Scenario: sudo hidden when not elevated
- **WHEN** scenario has `isSudo: false` or `isSudo` is absent
- **THEN** block is not visible

### Requirement: clock block (status)
The `clock` block SHALL show wall-clock time and optionally battery state. It SHALL define 4 style presets: `time-only`, `battery-icon`, `battery-pct`, `full`.

#### Scenario: clock presets defined
- **WHEN** the `clock` block is retrieved
- **THEN** it defines presets: `time-only`, `battery-icon`, `battery-pct`, `full`
- **AND** `defaultStyle` is `time-only`

#### Scenario: battery fields absent when no battery data
- **WHEN** `battery` is absent from scenario and preset is `full`
- **THEN** only the time portion renders

### Requirement: sysinfo block (status)
The `sysinfo` block SHALL show memory and disk utilisation. It SHALL define 3 style presets: `mem-only`, `mem+disk`, `full`.

#### Scenario: sysinfo presets defined
- **WHEN** the `sysinfo` block is retrieved
- **THEN** it defines presets: `mem-only`, `mem+disk`, `full`
- **AND** `defaultStyle` is `mem-only`

### Requirement: 14 language blocks
The registry SHALL contain blocks for: `node`, `python`, `ruby`, `go`, `rust`, `java`, `kotlin`, `scala`, `dotnet`, `php`, `lua`, `swift`, `dart`, `elixir`. Each SHALL be in the `language` category with 4 presets: `minimal`, `compare`, `extended`, `max`.

#### Scenario: language blocks available
- **WHEN** requesting blocks for surface "terminal-prompt" in the `language` category
- **THEN** exactly 14 blocks are returned with IDs matching the list above

#### Scenario: language block compare preset shows target
- **WHEN** the `node` block is used with preset `compare`, installed version `22.5.0`, and target version `20.10.0`
- **THEN** rendered output contains both `22.5.0` and `20.10.0` with a `→` separator

#### Scenario: language block compare hides target when absent
- **WHEN** preset is `compare` and no target version is present in scenario
- **THEN** output is identical to `minimal` (no `→`, no empty target)

#### Scenario: language block hidden outside project
- **WHEN** the relevant scenario field (e.g. `nodeVersion`) is absent
- **THEN** the block is not visible

### Requirement: 8 cloud blocks
The registry SHALL contain blocks for: `aws`, `azure`, `gcp`, `kubernetes`, `docker`, `helm`, `terraform`, `pulumi`. Each SHALL be in the `cloud` category with a single preset: `default`.

#### Scenario: cloud blocks available
- **WHEN** requesting blocks for surface "terminal-prompt" in the `cloud` category
- **THEN** exactly 8 blocks are returned with IDs: aws, azure, gcp, kubernetes, docker, helm, terraform, pulumi

#### Scenario: cloud block hidden when no context
- **WHEN** the relevant scenario field is absent
- **THEN** the cloud block is not visible

### Requirement: BlockDefinition includes export cost map
Each `BlockDefinition` SHALL include an `exportCosts` field of type `Record<ExportTargetId, number>`. All blocks currently in the registry SHALL declare cost 0 for both `bash-ps1` and `powershell-prompt`.

#### Scenario: Default export cost for standard blocks
- **WHEN** the registry is loaded
- **THEN** every block has `exportCosts["bash-ps1"] === 0` and `exportCosts["powershell-prompt"] === 0`

#### Scenario: Missing target key defaults to zero
- **WHEN** a block's exportCosts does not include a given target id
- **THEN** the cost is treated as 0 by the export cost aggregation logic

### Requirement: Zones declare per-target bindings
Each `ZoneDefinition` SHALL include a `targetBindings: Record<TargetId, ZoneTargetBinding>` map. Each entry describes how the zone maps into the named target's output.

#### Scenario: Terminal-prompt zones declare bash bindings
- **WHEN** inspecting the `terminal-prompt` surface in `src/lib/data/surfaces.ts`
- **THEN** each of its zones (`left-prompt`, `right-prompt`, `continuation-prompt`) declares a `bash-ps1` binding with appropriate slot and strategy values

#### Scenario: Terminal-prompt zones declare powershell bindings
- **WHEN** inspecting the same surface
- **THEN** each zone declares a `powershell-prompt` binding appropriate to PowerShell's prompt model
