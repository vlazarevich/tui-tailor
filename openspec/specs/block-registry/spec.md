## Requirements

### Requirement: Block definition schema
Each block in the registry SHALL have: a unique string ID, a display name, a category, a list of compatible surface IDs, a named elements map (each element with role, source or value, optional format, and optional themeSlot), a primary themeSlot for the block, style presets as element template strings, and a default style preset name.

#### Scenario: Block definition is complete
- **WHEN** a block is defined in the registry
- **THEN** it has all required fields: id, name, category, surfaces, elements (with at least one content-role element), themeSlot, styles (with at least one preset as a template string), and defaultStyle

#### Scenario: Element definition is valid
- **WHEN** a block defines an element
- **THEN** the element has a name, a role (content, icon, or connector), and either a source field or a value field

### Requirement: Block captures carry per-target shell bindings
Each `BlockDefinition` SHALL define a `captures: Record<string, CaptureDefinition>` map. Each capture represents a single piece of data the block needs at render time. A `CaptureDefinition` SHALL provide:
- `scenario: (data: ScenarioData) => string | number | boolean | undefined` — used by the browser preview to read a value from scenario data.
- `targets: Record<TargetId, TargetCaptureBinding>` — per-target bindings where each `TargetCaptureBinding` has `setup: string[]`, `ref: string`, and `guard: string`, all treated as opaque strings in the target's dialect.

#### Scenario: git-branch defines a branch capture
- **WHEN** the `git-branch` block is retrieved from the registry
- **THEN** it defines a capture named `branch` whose `scenario` reads `data.branch`, whose `bash-ps1` binding carries a `setup` that runs `git branch --show-current`, a `ref` of `$_branch`, and a `guard` of `[[ -n "$_branch" ]]`

#### Scenario: Capture binding strings are opaque to shared code
- **WHEN** a capture's `guard` or `setup` string is consumed by the shared compose pipeline
- **THEN** the pipeline passes the string through to the target verbatim without parsing or inspecting its contents

### Requirement: Elements reference captures instead of scenario fields
`ElementDefinition` SHALL support a `capture: string` field that names an entry in the owning block's `captures` map. Elements MAY continue to use `value: string` for static content (icons, connectors, literals). An element MUST NOT mix `capture` and `value`.

#### Scenario: Element references a capture
- **WHEN** the `git-branch` block's `branch` element is defined
- **THEN** it uses `capture: "branch"` and no longer uses a raw `source` field

#### Scenario: Static element unchanged
- **WHEN** a block's `icon` element is defined
- **THEN** it uses `value: "<glyph>"` unchanged and has no `capture` field

### Requirement: Style presets as element templates
Each block's style presets SHALL be template strings referencing element names with `{elementName}` syntax, not scenario field names. Templates control which elements are included and their ordering. Different style presets MAY reorder elements.

#### Scenario: Style preset defines element selection and order
- **WHEN** the `git-branch` block defines a "zen" style
- **THEN** the template is a string like `"{dirty} {branch}"` selecting only dirty and branch elements in that order

#### Scenario: Style presets vary element selection
- **WHEN** comparing zen and extended styles for `git-branch`
- **THEN** zen selects fewer elements (e.g., `"{dirty} {branch}"`) while extended selects more (e.g., `"{icon} {branch} {ahead}{behind} {dirty}"`)

### Requirement: Surface-scoped block filtering
The registry SHALL provide a function to retrieve all blocks compatible with a given surface ID. Only blocks that list the surface in their `surfaces` array SHALL be returned.

#### Scenario: Filter blocks for terminal prompt
- **WHEN** requesting blocks for surface "terminal-prompt"
- **THEN** only blocks with "terminal-prompt" in their surfaces array are returned

#### Scenario: Block compatible with multiple surfaces
- **WHEN** a block lists both "terminal-prompt" and "vim-statusline" in its surfaces
- **THEN** it appears in the results for both surface queries

### Requirement: Category system
Blocks SHALL be organized into categories. The registry SHALL provide a function to group blocks by category for a given surface.

#### Scenario: Group blocks by category
- **WHEN** requesting categorized blocks for a surface
- **THEN** blocks are returned grouped by their category field
- **AND** categories with no compatible blocks for that surface are omitted

### Requirement: Category ordering
The block catalog SHALL display categories in a defined order: essential, git, status, environment, cloud. Categories SHALL NOT be displayed in arbitrary/insertion order.

#### Scenario: Categories render in order
- **WHEN** the block catalog displays categories for terminal-prompt
- **THEN** essential appears before git, git before status, status before environment, environment before cloud

### Requirement: Environment category blocks
The registry SHALL include blocks for common runtime/language version display: `node-version`, `python-version`, `ruby-version`, `golang-version`, `rust-version`, `java-version`. Each SHALL define elements (version source, icon, connector), zen/minimal/extended style presets, and be compatible with the terminal-prompt surface.

#### Scenario: Environment blocks available for terminal prompt
- **WHEN** requesting blocks for surface "terminal-prompt"
- **THEN** the results include at least 6 blocks in the "environment" category

#### Scenario: Environment block element structure
- **WHEN** the `node-version` block is retrieved
- **THEN** it defines elements including a version element with `source: "nodeVersion"` and an icon element with a static node icon value

### Requirement: Cloud category blocks
The registry SHALL include blocks for cloud context display: `aws-profile`, `azure-subscription`, `gcp-project`, `kubernetes-context`. Each SHALL define elements, zen/minimal/extended style presets, and be compatible with the terminal-prompt surface.

#### Scenario: Cloud blocks available for terminal prompt
- **WHEN** requesting blocks for surface "terminal-prompt"
- **THEN** the results include at least 4 blocks in the "cloud" category

### Requirement: Additional status blocks
The registry SHALL include `jobs` (background job count) and `cmd-duration` (last command execution time) blocks in the "status" category, compatible with terminal-prompt. Each SHALL define elements with source fields, style presets, and appropriate theme slots.

#### Scenario: Status blocks expanded
- **WHEN** requesting blocks for surface "terminal-prompt" in the "status" category
- **THEN** the results include at least 4 blocks: exit-code, time, jobs, cmd-duration

### Requirement: Per-element theme sub-slots
The theme system SHALL support sub-slots for fine-grained block element coloring. Sub-slots follow the pattern `parentSlot-qualifier` (e.g., `vcs-ahead`, `vcs-behind`, `vcs-dirty`). Themes MAY define sub-slots explicitly. If a sub-slot is not defined in the active theme, it SHALL fall back to its parent slot.

#### Scenario: Theme defines sub-slot
- **WHEN** a theme defines `vcs: "#a6e3a1"` and `vcs-ahead: "#94e2d5"`
- **THEN** elements referencing `vcs-ahead` use "#94e2d5"

#### Scenario: Sub-slot falls back to parent
- **WHEN** a theme defines `vcs: "#a6e3a1"` but does not define `vcs-behind`
- **THEN** elements referencing `vcs-behind` fall back to "#a6e3a1"

### Requirement: Surface definition schema
Each surface SHALL have: a unique string ID, a display name, a list of zone definitions (each with ID and display name), a set of global options (e.g., multiline, promptChar) with types and defaults, and a default zone layout configuration.

#### Scenario: Surface defines zones
- **WHEN** a surface "terminal-prompt" is defined
- **THEN** it includes zones like "left-prompt" and "right-prompt", each with an ID and display name

#### Scenario: Surface defines global options
- **WHEN** a surface "terminal-prompt" is defined
- **THEN** it includes global options like multiline (boolean, default false) and promptChar (string, default "❯")

#### Scenario: Surface defines default zone layout
- **WHEN** a surface "terminal-prompt" is defined
- **THEN** it includes a default zone layout of type "plain" with gap " "

### Requirement: Seed data
The registry SHALL include block definitions sufficient for a full terminal prompt experience. At minimum: one surface ("Terminal Prompt") with two zones, and at least 19 blocks across 5 categories (essential, git, status, environment, cloud). All blocks SHALL use the element-based definition model.

#### Scenario: App renders with full block catalog
- **WHEN** the app loads
- **THEN** the surface switcher shows at least one surface
- **AND** the block catalog shows at least 19 blocks in at least 5 categories

## MODIFIED Requirements

### Requirement: BlockDefinition includes export cost map
Each `BlockDefinition` SHALL include an `exportCosts` field of type `Record<ExportTargetId, number>`. This field declares the cost of exporting this block to each known target. Absent entries default to 0 (native support). All blocks currently in the registry SHALL declare cost 0 for both `bash-ps1` and `powershell-prompt`.

#### Scenario: Default export cost for standard blocks
- **WHEN** the registry is loaded
- **THEN** every block has `exportCosts["bash-ps1"] === 0` and `exportCosts["powershell-prompt"] === 0`

#### Scenario: Missing target key defaults to zero
- **WHEN** a block's exportCosts does not include a given target id
- **THEN** the cost is treated as 0 by the export cost aggregation logic
