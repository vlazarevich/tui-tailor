## ADDED Requirements

### Requirement: PowerShell exporter drives zone handling from target bindings
The PowerShell exporter SHALL iterate `SURFACES[activeSurfaceId].zones` and dispatch each zone according to its `powershell-prompt` `ZoneTargetBinding`. The exporter MUST NOT reference zone IDs by string literal in its logic.

#### Scenario: No hardcoded zone IDs
- **WHEN** searching `src/lib/exporters/powershell.ts` for literal zone-ID strings
- **THEN** no matches are found

#### Scenario: New surface routing
- **WHEN** a surface with custom zone IDs declares `powershell-prompt` bindings
- **THEN** the PowerShell exporter routes each zone correctly without code changes to the exporter
