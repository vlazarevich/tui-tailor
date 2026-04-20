## ADDED Requirements

### Requirement: Bash exporter drives zone handling from target bindings
The Bash exporter SHALL iterate `SURFACES[activeSurfaceId].zones` and dispatch each zone according to its `bash-ps1` `ZoneTargetBinding`. The exporter MUST NOT reference zone IDs (`"left-prompt"`, `"right-prompt"`, `"continuation-prompt"`) by string literal anywhere in its logic.

#### Scenario: No hardcoded zone IDs
- **WHEN** searching `src/lib/exporters/bash.ts` for the literal strings `"left-prompt"`, `"right-prompt"`, or `"continuation-prompt"`
- **THEN** no matches are found

#### Scenario: Adding a new surface with custom zones requires no exporter edit
- **WHEN** a surface is added to `src/lib/data/surfaces.ts` with zones that declare valid `bash-ps1` bindings
- **THEN** the Bash exporter routes each zone correctly without modifications to `src/lib/exporters/bash.ts`

### Requirement: Unknown slots produce explicit warnings
When a zone's `bash-ps1` binding references a `slot` the Bash target does not implement, the exporter SHALL emit a warning naming the zone, the slot, and omit the zone's output rather than crashing or silently producing garbage.

#### Scenario: Unrecognized slot warning
- **WHEN** a zone declares `{ slot: "unsupported-slot" }` for `bash-ps1`
- **THEN** the exporter result contains a warning identifying the zone and the slot, and the zone contributes no output to the generated code
