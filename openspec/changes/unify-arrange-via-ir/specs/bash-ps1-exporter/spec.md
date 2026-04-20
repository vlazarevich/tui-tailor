## ADDED Requirements

### Requirement: Bash exporter consumes the shared zone IR
The Bash exporter SHALL obtain zone layout via the shared `compose/arrange` module and SHALL NOT carry its own copies of powerline or powertab zone generators. `generatePowerlineZoneCode`, `generatePowertabZoneCode`, and `generatePowerlineBlockContent` in `src/lib/exporters/bash.ts` SHALL be deleted.

#### Scenario: No zone-layout code in exporter
- **WHEN** searching `src/lib/exporters/bash.ts` for functions named `generatePowerline*` or `generatePowertab*`
- **THEN** no matches are found

### Requirement: Every block the preview can render in a powerline/powertab zone is exported
When a zone uses `powerline` or `powertab` layout, the Bash exporter SHALL emit code for every block whose preview is visible. If a specific block lacks a `bash-ps1` target binding for a required capture, the exporter SHALL record a warning naming the block rather than silently omitting it.

#### Scenario: git-status in a powerline zone exports
- **WHEN** a user adds `git-status` to a left-prompt zone with powerline layout and exports Bash
- **THEN** the generated code contains a segment that renders git-status at runtime, matching the preview's placement and style

#### Scenario: Block without target binding produces a warning
- **WHEN** a block in the active config has no `bash-ps1` binding for one of its required captures
- **THEN** the exporter result includes a warning identifying the block; the block is omitted from the output with that warning as the stated reason
