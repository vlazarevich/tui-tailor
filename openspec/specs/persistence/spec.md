## ADDED Requirements

### Requirement: Auto-save to localStorage per surface
The system SHALL automatically save the active surface's configuration to localStorage on every state change, debounced by 500ms. Each surface's config SHALL be stored under a unique key (`tui-tailor:<surface-id>`). The saved config SHALL include zone enabled/disabled state (`ZoneConfig.enabled`).

#### Scenario: Config is saved after adding a block
- **WHEN** the user adds a block to a zone
- **THEN** within 500ms the updated configuration is written to localStorage under the active surface's key

#### Scenario: Config is restored on surface switch
- **WHEN** the user switches to a surface that has a saved configuration in localStorage
- **THEN** the canvas loads the saved zone layouts, block selections, style choices, global options, and zone enabled/disabled state

#### Scenario: Config is restored on page reload
- **WHEN** the user reloads the page
- **THEN** the last active surface and its configuration are restored from localStorage

### Requirement: ZoneConfig.enabled backward compatibility
When loading a saved surface config that does not include `enabled` on a `ZoneConfig` entry, the system SHALL treat the absence of `enabled` as `true` (zone is enabled). No explicit migration step is required.

#### Scenario: Legacy config loaded without enabled field
- **WHEN** a config saved before this change is loaded from localStorage
- **THEN** all zones are treated as enabled and the canvas renders normally

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
