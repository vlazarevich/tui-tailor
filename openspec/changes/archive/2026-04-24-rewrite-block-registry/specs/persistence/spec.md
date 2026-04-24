## ADDED Requirements

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
