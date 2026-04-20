## ADDED Requirements

### Requirement: Export panel surfaces per-block missing-binding warnings
When an exporter reports warnings about blocks missing a target binding, the `ExportPopup` component SHALL display each warning as a distinct line identifying the block by display name and stating the reason (e.g. "git-status: no bash-ps1 binding for capture 'unstaged'").

#### Scenario: Warning visible for a block dropped due to missing binding
- **WHEN** the active export target has no binding for a capture used by a block in the current config
- **THEN** the export popup renders a warning line that names the block and the missing binding

#### Scenario: No false positives
- **WHEN** every block in the current config has full bindings for the active target
- **THEN** no missing-binding warnings are rendered
