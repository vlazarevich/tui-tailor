## ADDED Requirements

### Requirement: Auto-save to localStorage per surface
The system SHALL automatically save the active surface's configuration to localStorage on every state change, debounced by 500ms. Each surface's config SHALL be stored under a unique key (`tui-tailor:<surface-id>`).

#### Scenario: Config is saved after adding a block
- **WHEN** the user adds a block to a zone
- **THEN** within 500ms the updated configuration is written to localStorage under the active surface's key

#### Scenario: Config is restored on surface switch
- **WHEN** the user switches to a surface that has a saved configuration in localStorage
- **THEN** the canvas loads the saved zone layouts, block selections, style choices, and global options

#### Scenario: Config is restored on page reload
- **WHEN** the user reloads the page
- **THEN** the last active surface and its configuration are restored from localStorage

### Requirement: Theme preference persistence
The system SHALL save the selected theme ID to localStorage (`tui-tailor:theme`). This preference SHALL be restored on page load.

#### Scenario: Theme persists across sessions
- **WHEN** the user selects the Tokyo Night theme and reloads the page
- **THEN** the Tokyo Night theme is applied on load

### Requirement: Base64 config string export
The system SHALL provide an action to serialize the active surface's configuration into a base64-encoded string. The string SHALL encode: surface ID, zone block lists (block IDs and style choices), theme ID, and global options.

#### Scenario: Export config string
- **WHEN** the user triggers the config string export
- **THEN** a base64 string is produced that can be copied to clipboard

#### Scenario: Config string does not include block definitions
- **WHEN** a config string is exported
- **THEN** it contains only references to block IDs and style preset names, not the full block definitions

### Requirement: Base64 config string import
The system SHALL provide an input field where users can paste a base64 config string. Importing SHALL replace the active surface's configuration with the decoded data.

#### Scenario: Import valid config string
- **WHEN** the user pastes a valid base64 config string
- **THEN** the canvas updates to reflect the imported configuration
- **AND** the imported config is auto-saved to localStorage

#### Scenario: Import invalid config string
- **WHEN** the user pastes an invalid or corrupted string
- **THEN** the system displays an error message
- **AND** the current configuration is not modified
