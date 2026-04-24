## ADDED Requirements

### Requirement: Auto-save to localStorage per surface
The system SHALL automatically save the active surface's configuration to localStorage on every state change, debounced by 500ms. Each surface's config SHALL be stored under a unique key (`tui-tailor:<surface-id>`). The saved config SHALL include zone enabled/disabled state (`ZoneConfig.enabled`).

#### Scenario: Config is saved after adding a block
- **WHEN** the user adds a block to a zone
- **THEN** within 500ms the updated configuration is written to localStorage under the active surface's key

#### Scenario: Config is restored on surface switch
- **WHEN** the user switches to a surface that has a saved configuration in localStorage
- **THEN** the canvas loads the saved zone layout types, block selections, style choices, global options, and zone enabled/disabled state

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

### Requirement: ZoneConfig.layout as layout type reference
`ZoneConfig.layout` SHALL store only a `ZoneLayoutType` string (e.g., `"plain"`, `"brackets"`) — not a full layout config object. Canonical layout configurations (separators, padding, gap characters) are globally defined in the app and are not user-configurable. Only the layout type reference is persisted.

#### Scenario: Layout type is saved, not config object
- **WHEN** the user selects "brackets" as the zone layout
- **THEN** `ZoneConfig.layout` stores `"brackets"` and the canonical brackets config is resolved at render time

### Requirement: ZoneConfig.layout migration from full object
When loading a saved surface config where `ZoneConfig.layout` is a full object (old format), the system SHALL extract the `type` field and discard the config sub-object.

#### Scenario: Old format config loaded
- **WHEN** a config saved before this change is loaded from localStorage or imported via base64 string
- **THEN** the layout field is migrated to the type string and the canvas renders correctly

### Requirement: Base64 config string export
The system SHALL provide an action to serialize the active surface's configuration into a base64-encoded string. The string SHALL encode: surface ID, zone layout type references (not full layout configs), zone block lists (block IDs and style choices), theme ID, and global options.

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

### Requirement: Persisted configs validate canonical block IDs
When loading a saved or imported surface config, the system SHALL validate every block ID against the canonical registry. If any block ID is unknown (not present in the registry), the entire config SHALL be discarded and replaced with the surface's default config. The system SHALL NOT attempt to partially preserve configs with unknown IDs.

#### Scenario: Legacy localStorage config is discarded
- **WHEN** localStorage contains a terminal-prompt config referencing legacy block IDs such as `git-branch` or `node-version`
- **THEN** the loader discards the config entirely
- **AND** the app initialises with a valid default canonical configuration

#### Scenario: Valid config loads normally
- **WHEN** localStorage contains a config whose block IDs all exist in the canonical registry
- **THEN** the config loads without modification

#### Scenario: Imported config with unknown block ID is rejected
- **WHEN** the user imports a base64 config string containing a block ID not present in the canonical registry
- **THEN** the import fails validation
- **AND** the current configuration is not modified

### Requirement: Exported config strings use canonical block IDs only
Config string export SHALL serialize only canonical block IDs and style preset names. Exported strings SHALL NOT contain removed legacy IDs.

#### Scenario: Export canonical config string
- **WHEN** the active config contains canonical blocks
- **THEN** the exported base64 string decodes to block references using canonical IDs such as `session`, `git`, `last-command`, and `node`
