## ADDED Requirements

### Requirement: App shell layout
The system SHALL render a structured layout with these regions: a top toolbar, a block catalog panel (left column, fixed width), a center column split vertically between zone editors (top) and a live preview pane (bottom), a full-height export panel (right column, fixed width), and a bottom status bar. The layout SHALL fill the viewport height. The center column's two sections SHALL each independently scroll.

#### Scenario: Initial render
- **WHEN** the app loads
- **THEN** the toolbar, block catalog, zone editors, preview pane, export panel, and status bar are all visible without scrolling on a standard viewport (1280x720 or larger)

### Requirement: Surface switcher
The system SHALL display a surface switcher in the toolbar that lists all available surfaces (e.g., "Terminal Prompt", "Vim Statusline"). The user SHALL be able to switch between surfaces. Switching surfaces SHALL load that surface's saved configuration from persistence (or defaults if none saved).

#### Scenario: Switch to a different surface
- **WHEN** the user selects a different surface from the switcher
- **THEN** the canvas updates to show that surface's zones and configured blocks
- **AND** the block catalog updates to show only blocks compatible with the selected surface

#### Scenario: Surface with no saved config
- **WHEN** the user switches to a surface that has no saved configuration
- **THEN** the canvas shows the surface's default zones with no blocks added

### Requirement: Block catalog panel
The system SHALL display a block catalog panel listing all blocks compatible with the active surface. Blocks SHALL be grouped by category (e.g., "Essential", "Git", "Environment", "Cloud", "Status"). Each block entry SHALL display the block's name.

#### Scenario: Catalog reflects active surface
- **WHEN** the active surface is "Terminal Prompt"
- **THEN** the catalog shows blocks compatible with terminal prompts (user, host, cwd, git_branch, etc.)
- **AND** blocks incompatible with terminal prompts (e.g., editor_mode, line_col) are not shown

#### Scenario: Category grouping
- **WHEN** the catalog renders
- **THEN** blocks are grouped under collapsible category headers

### Requirement: Block catalog search and filter
The system SHALL provide a search input in the block catalog that filters blocks by name. Filtering SHALL be instant (no debounce needed) and case-insensitive.

#### Scenario: Search filters blocks
- **WHEN** the user types "git" in the search input
- **THEN** only blocks whose name contains "git" are displayed
- **AND** empty categories are hidden

#### Scenario: Clear search
- **WHEN** the user clears the search input
- **THEN** all compatible blocks are displayed again in their categories

### Requirement: Zone-based canvas
The system SHALL render the canvas as a set of named zones defined by the active surface. Each zone SHALL display its ordered list of block instances. The user SHALL be able to add blocks to a zone, remove blocks from a zone, and reorder blocks within a zone.

#### Scenario: Add a block to a zone
- **WHEN** the user adds a block from the catalog to a zone
- **THEN** the block appears at the end of that zone's block list
- **AND** the state is auto-saved

#### Scenario: Remove a block from a zone
- **WHEN** the user removes a block from a zone
- **THEN** the block disappears from the zone
- **AND** the block remains available in the catalog for re-adding

#### Scenario: Reorder blocks within a zone
- **WHEN** the user moves a block to a different position within the same zone
- **THEN** the block list reflects the new order
- **AND** the state is auto-saved

### Requirement: Status bar
The system SHALL render a fixed bottom status bar displaying: the active surface name, the count of active blocks, and the active theme name.

#### Scenario: Status bar reflects current state
- **WHEN** the user has configured 5 blocks on the Terminal Prompt surface with the Dracula theme
- **THEN** the status bar displays "Terminal Prompt", "5 blocks", and "Dracula"
