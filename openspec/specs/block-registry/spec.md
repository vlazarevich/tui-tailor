## ADDED Requirements

### Requirement: Block definition schema
Each block in the registry SHALL have: a unique string ID, a display name, a category, a list of compatible surface IDs, a set of named style presets, a semantic theme slot reference, and a default style preset.

#### Scenario: Block definition is complete
- **WHEN** a block is defined in the registry
- **THEN** it has all required fields: id, name, category, surfaces, styles (with at least one preset), themeSlot, and defaultStyle

#### Scenario: Style preset structure
- **WHEN** a block defines a style preset
- **THEN** the preset specifies a format string and an icon boolean at minimum

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

### Requirement: Surface definition schema
Each surface SHALL have: a unique string ID, a display name, a list of zone definitions (each with ID and display name), and a set of global options (e.g., multiline, promptChar) with types and defaults.

#### Scenario: Surface defines zones
- **WHEN** a surface "terminal-prompt" is defined
- **THEN** it includes zones like "left-prompt" and "right-prompt", each with an ID and display name

#### Scenario: Surface defines global options
- **WHEN** a surface "terminal-prompt" is defined
- **THEN** it includes global options like multiline (boolean, default false) and promptChar (string, default "❯")

### Requirement: Seed data for M1
The registry SHALL include placeholder surface and block definitions sufficient to demonstrate the app shell. At minimum: one surface ("Terminal Prompt") with two zones, and at least five blocks across two categories.

#### Scenario: App renders with seed data
- **WHEN** the app loads
- **THEN** the surface switcher shows at least one surface
- **AND** the block catalog shows at least five blocks in at least two categories
