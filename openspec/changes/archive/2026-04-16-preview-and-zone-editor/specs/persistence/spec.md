## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: ZoneConfig.enabled backward compatibility
When loading a saved surface config that does not include `enabled` on a `ZoneConfig` entry, the system SHALL treat the absence of `enabled` as `true` (zone is enabled). No explicit migration step is required.

#### Scenario: Legacy config loaded without enabled field
- **WHEN** a config saved before this change is loaded from localStorage
- **THEN** all zones are treated as enabled and the canvas renders normally
