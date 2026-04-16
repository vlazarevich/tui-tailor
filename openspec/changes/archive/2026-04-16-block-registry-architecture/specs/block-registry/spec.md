## ADDED Requirements

### Requirement: Element-based block definition
Each block in the registry SHALL define its data as named elements instead of flat format strings. Each element SHALL have: a unique name within the block, a role (`content`, `icon`, or `connector`), an optional `themeSlot` override, and either a `source` field (scenario data key) or a `value` field (static text). Elements with a source MAY also define a `format` string where `{}` is replaced by the resolved source value.

#### Scenario: Block defines elements
- **WHEN** the `git-branch` block is retrieved from the registry
- **THEN** it defines elements including: branch (source-based, role: content), icon (static value, role: icon), ahead (source-based with format "↑{}", role: content), dirty (source-based flag with format "*", role: content), connector (static value "on", role: connector)

#### Scenario: Element with per-element theme slot
- **WHEN** the `git-branch` block defines an `ahead` element
- **THEN** the element MAY specify `themeSlot: "vcs-ahead"` to override the block's primary `themeSlot: "vcs"`

### Requirement: Style presets as element templates
Each block's style presets SHALL be template strings referencing element names with `{elementName}` syntax, not scenario field names. Templates control which elements are included and their ordering. Different style presets MAY reorder elements.

#### Scenario: Style preset defines element selection and order
- **WHEN** the `git-branch` block defines a "zen" style
- **THEN** the template is a string like `"{dirty} {branch}"` selecting only dirty and branch elements in that order

#### Scenario: Style presets vary element selection
- **WHEN** comparing zen and extended styles for `git-branch`
- **THEN** zen selects fewer elements (e.g., `"{dirty} {branch}"`) while extended selects more (e.g., `"{icon} {branch} {ahead}{behind} {dirty}"`)

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

### Requirement: Category ordering
The block catalog SHALL display categories in a defined order: essential, git, status, environment, cloud. Categories SHALL NOT be displayed in arbitrary/insertion order.

#### Scenario: Categories render in order
- **WHEN** the block catalog displays categories for terminal-prompt
- **THEN** essential appears before git, git before status, status before environment, environment before cloud

### Requirement: Per-element theme sub-slots
The theme system SHALL support sub-slots for fine-grained block element coloring. Sub-slots follow the pattern `parentSlot-qualifier` (e.g., `vcs-ahead`, `vcs-behind`, `vcs-dirty`). Themes MAY define sub-slots explicitly. If a sub-slot is not defined in the active theme, it SHALL fall back to its parent slot.

#### Scenario: Theme defines sub-slot
- **WHEN** a theme defines `vcs: "#a6e3a1"` and `vcs-ahead: "#94e2d5"`
- **THEN** elements referencing `vcs-ahead` use "#94e2d5"

#### Scenario: Sub-slot falls back to parent
- **WHEN** a theme defines `vcs: "#a6e3a1"` but does not define `vcs-behind`
- **THEN** elements referencing `vcs-behind` fall back to "#a6e3a1"

## MODIFIED Requirements

### Requirement: Block definition schema
Each block in the registry SHALL have: a unique string ID, a display name, a category, a list of compatible surface IDs, a named elements map (each element with role, source or value, optional format, and optional themeSlot), a primary themeSlot for the block, style presets as element template strings, and a default style preset name.

#### Scenario: Block definition is complete
- **WHEN** a block is defined in the registry
- **THEN** it has all required fields: id, name, category, surfaces, elements (with at least one content-role element), themeSlot, styles (with at least one preset as a template string), and defaultStyle

#### Scenario: Element definition is valid
- **WHEN** a block defines an element
- **THEN** the element has a name, a role (content, icon, or connector), and either a source field or a value field

### Requirement: Seed data for M1
The registry SHALL include block definitions sufficient for a full terminal prompt experience. At minimum: one surface ("Terminal Prompt") with two zones, and at least 19 blocks across 5 categories (essential, git, status, environment, cloud). All blocks SHALL use the element-based definition model.

#### Scenario: App renders with full block catalog
- **WHEN** the app loads
- **THEN** the surface switcher shows at least one surface
- **AND** the block catalog shows at least 19 blocks in at least 5 categories

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
