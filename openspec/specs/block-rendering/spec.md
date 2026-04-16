## Requirements

### Requirement: Four-stage rendering pipeline
The rendering system SHALL implement a four-stage pipeline: Emit (block + scenario → element bag), Select (style template + element bag → ordered spans), Arrange (zone layout + block spans → render spans), Paint (render spans + theme → concrete colors). Each stage SHALL have clearly separated responsibilities with no stage bypassing another.

#### Scenario: Full pipeline execution
- **WHEN** a zone with blocks is rendered against a scenario and theme
- **THEN** the pipeline executes emit, select, arrange, and paint in sequence
- **AND** each stage consumes only the output of the previous stage

### Requirement: Emit stage — element resolution
The emit stage SHALL resolve a block's element definitions against scenario data to produce an element bag. Each element in the bag SHALL contain: resolved text, theme slot (inherited from block if not overridden), and role. Elements with a `source` field SHALL resolve their text from the corresponding scenario field. Elements with a `value` field SHALL use that static value. Elements with a `format` field SHALL use it as a mini-template where `{}` is replaced by the source value. If a source field is missing or empty in the scenario, the element's resolved text SHALL be empty string.

#### Scenario: Element resolves from scenario source
- **WHEN** an element has `source: "branch"` and the scenario has `branch: "main"`
- **THEN** the element resolves to `{ text: "main", ... }`

#### Scenario: Element with format template
- **WHEN** an element has `source: "ahead", format: "↑{}"` and the scenario has `ahead: "3"`
- **THEN** the element resolves to `{ text: "↑3", ... }`

#### Scenario: Static value element
- **WHEN** an element has `value: ""` and no source
- **THEN** the element resolves to `{ text: "", ... }` regardless of scenario

#### Scenario: Element with missing scenario field
- **WHEN** an element has `source: "ahead"` and the scenario has no `ahead` field
- **THEN** the element resolves to `{ text: "", ... }`

#### Scenario: Element with flag format — truthy
- **WHEN** an element has `source: "dirty", format: "*"` and the scenario has `dirty: true` (strict `=== true`)
- **THEN** the element resolves to `{ text: "*", ... }`

#### Scenario: Element with flag format — falsy
- **WHEN** an element has `source: "dirty", format: "*"` and the scenario has `dirty: false`, `dirty: 0`, `dirty: ""`, or no `dirty` field
- **THEN** the element resolves to `{ text: "", ... }`

### Requirement: Element theme slot inheritance
Each element SHALL have an optional `themeSlot` field. If an element does not define its own `themeSlot`, it SHALL inherit the block's top-level `themeSlot`. Elements MAY override with a more specific slot (e.g., `vcs-ahead` overriding block-level `vcs`).

#### Scenario: Element inherits block theme slot
- **WHEN** a block has `themeSlot: "vcs"` and an element has `themeSlot: null`
- **THEN** the element's resolved theme slot is `"vcs"`

#### Scenario: Element overrides block theme slot
- **WHEN** a block has `themeSlot: "vcs"` and an element has `themeSlot: "vcs-ahead"`
- **THEN** the element's resolved theme slot is `"vcs-ahead"`

### Requirement: Element roles
Each element SHALL declare a role: `content`, `icon`, or `connector`. Roles serve as the contract between blocks and zone layouts. Layouts MAY use roles to apply different visual treatment (e.g., flow layout prepends connector elements, powertab layout applies background color to icon elements only).

#### Scenario: Content role
- **WHEN** an element has `role: "content"`
- **THEN** it is treated as primary block data by all layouts

#### Scenario: Icon role
- **WHEN** an element has `role: "icon"`
- **THEN** powertab layout applies the block's theme slot as background to this element
- **AND** other layouts treat it the same as content

#### Scenario: Connector role
- **WHEN** an element has `role: "connector"`
- **THEN** flow layout prepends it to the block's content
- **AND** other layouts ignore it

### Requirement: Select stage — style template application
The select stage SHALL take a style template string and the resolved element bag, and produce an ordered list of spans. The template uses `{elementName}` tokens to reference elements. The output SHALL preserve element boundaries and their theme slots — it SHALL NOT produce a flat joined string. Literal characters in the template (spaces, punctuation) SHALL become spans with null theme slot.

#### Scenario: Template produces ordered spans
- **WHEN** the style template is `"{icon} {branch} {dirty}"` and elements resolve to icon="", branch="main", dirty="*"
- **THEN** the output is an ordered span list: [("", vcs), (" ", null), ("main", vcs), (" ", null), ("*", vcs-dirty)]

#### Scenario: Adjacent tokens without space
- **WHEN** the style template is `"{ahead}{behind}"` and elements resolve to ahead="↑1", behind="↓2"
- **THEN** the output spans are adjacent with no literal span between them: [("↑1", vcs-ahead), ("↓2", vcs-behind)]

#### Scenario: Empty element in template
- **WHEN** the style template includes `{behind}` and behind resolved to empty string
- **THEN** the span for behind is omitted from the output
- **AND** adjacent literal spans collapse (no double spaces)

### Requirement: Block visibility
A block SHALL be considered not visible when ALL of its source-based elements resolve to empty text after the select stage. Static-value elements (icons, connectors) SHALL NOT count toward visibility. The arrange stage SHALL skip non-visible blocks entirely, including their separators and decorations.

#### Scenario: Block with all empty sources is hidden
- **WHEN** a block's source-based elements all resolve to empty text (e.g., node-version in a non-node scenario)
- **THEN** the block is marked not visible and excluded from zone output

#### Scenario: Block with at least one non-empty source is visible
- **WHEN** a block has `branch: "main"` resolved (non-empty) even if other elements are empty
- **THEN** the block is visible

#### Scenario: Static-only elements do not make block visible
- **WHEN** a block has only an icon (static value) and a connector (static value) but all source elements are empty
- **THEN** the block is not visible (icon and connector alone do not justify rendering)

### Requirement: Select stage style fallback
The select stage SHALL use the block instance's selected style preset to determine which template to apply. If the style is not found in the block definition, it SHALL fall back to the block's `defaultStyle` preset.

#### Scenario: Render with selected style
- **WHEN** a block instance has style "extended" and the block defines an "extended" template
- **THEN** the select stage uses the "extended" template

#### Scenario: Fallback to default style
- **WHEN** a block instance has style "custom" which does not exist in the block definition
- **THEN** the select stage falls back to the block's `defaultStyle` template

### Requirement: Arrange stage — zone layout types
The arrange stage SHALL support pluggable zone layout types. At minimum, the following types SHALL be supported: `plain`, `flow`, `brackets`, `powerline`, `powertab`. Each layout type SHALL implement its own logic for combining block spans into a final render span sequence.

#### Scenario: Plain layout
- **WHEN** a zone uses layout type "plain" with gap " "
- **THEN** visible blocks' spans are concatenated with a gap span between each block

#### Scenario: Flow layout
- **WHEN** a zone uses layout type "flow"
- **THEN** each block's connector element (if present) is prepended to its content, regardless of block position (first, middle, or last)
- **AND** connector spans use a "muted" theme reference for fg

#### Scenario: Flow layout — first block with connector
- **WHEN** the first block in a flow-layout zone has a connector element "on"
- **THEN** the connector is prepended as normal — no special-casing for first position

#### Scenario: Brackets layout
- **WHEN** a zone uses layout type "brackets" with open "[", close "]", and padding " "
- **THEN** each visible block's spans are wrapped in bracket spans with padding between content and brackets
- **AND** bracket spans and padding use a "border" theme reference for fg

#### Scenario: Brackets padding is layout-controlled
- **WHEN** a brackets layout has padding " " and a block's content is " main *"
- **THEN** the rendered output is "[ main *]" where the spaces adjacent to brackets come from layout config, not from the style template

#### Scenario: Powerline layout
- **WHEN** a zone uses layout type "powerline" with separator "" and terminator ""
- **THEN** each block's spans are rendered with bg set to the block's themeSlot
- **AND** fg for all content is auto-contrast (ignoring per-element themeSlot)
- **AND** separator glyphs between blocks have fg=previous block's themeSlot and bg=next block's themeSlot
- **AND** a terminator glyph after the last block has fg=last block's themeSlot and bg="default"

#### Scenario: Powertab layout
- **WHEN** a zone uses layout type "powertab" with separator "" and terminator ""
- **THEN** icon-role elements are rendered with bg set to block's themeSlot and fg as auto-contrast
- **AND** content-role elements are rendered with default bg and per-element themeSlot as fg
- **AND** separator glyphs transition between the icon region's bg and default bg
- **AND** a terminator glyph after the last block transitions to default bg

#### Scenario: Powertab with block missing icon element
- **WHEN** a block has no icon-role element and the zone uses powertab layout
- **THEN** a fallback empty tab region is rendered with the block's themeSlot as bg
- **AND** separator glyphs still appear around the empty tab region

#### Scenario: Hidden blocks excluded from layout
- **WHEN** a zone has blocks [cwd, node-version, git-branch] and node-version is not visible
- **THEN** the layout skips node-version entirely (no empty brackets, no orphan separators)

### Requirement: Zone layout configuration
Each zone in a surface config SHALL specify a `ZoneLayout` with a type and type-specific configuration. The layout type SHALL be one of the supported types. Type-specific config SHALL include: plain (gap string), brackets (open, close, padding, gap strings), powerline (separator glyph, terminator glyph), powertab (separator glyph, terminator glyph), flow (no additional config — connectors come from blocks).

#### Scenario: Zone specifies layout
- **WHEN** a zone config has `layout: { type: "brackets", config: { open: "[", close: "]", padding: " ", gap: " " } }`
- **THEN** the arrange stage uses brackets layout with those parameters

#### Scenario: Default layout
- **WHEN** a zone config does not specify a layout
- **THEN** the default layout is plain with gap " "

### Requirement: User-selectable zone layout
Zone layout SHALL be stored in `SurfaceConfig` (user state) and be user-changeable per zone. Users SHALL have an option to apply a layout change to all zones in the current surface.

#### Scenario: User changes layout for one zone
- **WHEN** the user selects "powerline" layout for the "left-prompt" zone
- **THEN** only the left-prompt zone's layout changes
- **AND** other zones retain their current layout

#### Scenario: User applies layout to all zones
- **WHEN** the user selects "brackets" layout and chooses "apply to all zones"
- **THEN** all zones in the current surface switch to brackets layout

### Requirement: Arrange stage render span output
The arrange stage SHALL produce an array of `RenderSpan` objects. Each span SHALL contain: text, fg (theme slot reference, "auto-contrast", "muted", or "border"), bg (theme slot reference, "default", or null), and role ("content", "icon", "connector", "bracket", or "separator").

#### Scenario: Render span with semantic color references
- **WHEN** the arrange stage produces a content span from a block with themeSlot "vcs"
- **THEN** the span has `fg: "vcs"` and `bg: null` (for plain/flow/brackets layouts)

#### Scenario: Powerline render span
- **WHEN** the arrange stage produces a content span in powerline layout from a block with themeSlot "vcs"
- **THEN** the span has `fg: "auto-contrast"` and `bg: "vcs"`

### Requirement: Paint stage — theme resolution
The paint stage SHALL resolve all semantic color references in render spans to concrete CSS color values using the active theme. `auto-contrast` fg SHALL be resolved by computing contrast against the resolved bg color. "muted" and "border" SHALL resolve to the theme's muted text and border colors respectively. "default" bg SHALL resolve to the surface's default background color.

#### Scenario: Theme slot resolution
- **WHEN** a span has `fg: "vcs"` and the active theme defines vcs as "#a6e3a1"
- **THEN** the painted span has `fg: "#a6e3a1"`

#### Scenario: Auto-contrast resolution
- **WHEN** a span has `fg: "auto-contrast"` and `bg: "vcs"` which resolves to "#a6e3a1"
- **THEN** the painted span has a fg color with WCAG AA compliant contrast (minimum 4.5:1 ratio) against "#a6e3a1"

#### Scenario: Sub-slot with fallback
- **WHEN** a span has `fg: "vcs-ahead"` and the theme does not define `vcs-ahead`
- **THEN** the paint stage falls back to the parent slot `vcs`

### Requirement: Scenario data model
Each surface SHALL define a scenario shape (typed fields representing simulated terminal context) and a set of named scenario presets. The terminal-prompt surface SHALL include at minimum these scenario fields: `cwd`, `user`, `host`, `branch`, `dirty`, `staged`, `unstaged`, `untracked`, `ahead`, `behind`, `exitCode`, `nodeVersion`, `pythonVersion`, `rubyVersion`, `golangVersion`, `rustVersion`, `javaVersion`, `awsProfile`, `azureSub`, `gcpProject`, `k8sContext`, `time`, `jobCount`, `cmdDuration`.

#### Scenario: Terminal prompt scenario presets
- **WHEN** the terminal-prompt surface is loaded
- **THEN** at least 5 scenario presets are available: "Home Directory", "Git Repository", "Node Project", "Python Project", "Error State"

#### Scenario: Scenario preset provides realistic data
- **WHEN** the "Node Project" preset is selected
- **THEN** it provides non-empty values for `cwd`, `user`, `host`, `branch`, and `nodeVersion` at minimum

#### Scenario: Missing scenario field
- **WHEN** a scenario preset does not define a field that a block element's source references
- **THEN** that element resolves to empty string
