## ADDED Requirements

### Requirement: ExportTarget carries block and zone cost maps
`ExportTarget` SHALL include `blockCosts: Record<string, number>` and `zoneCosts: Record<string, number>` in addition to `id`, `name`, and `surfaceId`. Costs are integers: 0 = native support, 100 = not feasible. Values between 0 and 100 indicate degraded or partial support.

#### Scenario: Block cost lookup
- **WHEN** an exporter queries the cost for a block on a given target
- **THEN** it reads `target.blockCosts[blockId]`, defaulting to 0 if absent

#### Scenario: Zone cost lookup
- **WHEN** the export panel evaluates whether to show a warning for a zone
- **THEN** it reads `target.zoneCosts[zoneId]`, defaulting to 0 if absent

### Requirement: Export target registry defines bash-ps1 and powershell-prompt
The app SHALL define two export targets for the `terminal-prompt` surface: `bash-ps1` and `powershell-prompt`. All current block costs SHALL be 0 for both targets. The `right-prompt` zone SHALL have cost 75 for `bash-ps1` and cost 0 for `powershell-prompt`.

#### Scenario: Bash right-prompt zone cost
- **WHEN** the export panel loads with target `bash-ps1` and right-prompt zone is enabled
- **THEN** a warning is displayed indicating limited right-prompt support

#### Scenario: PowerShell right-prompt zone cost
- **WHEN** the export panel loads with target `powershell-prompt` and right-prompt zone is enabled
- **THEN** no zone-level warning is shown

### Requirement: Total cost is sum of active block costs plus active zone costs
The export panel SHALL compute total cost as the sum of `blockCosts` for all enabled blocks plus `zoneCosts` for all enabled zones.

#### Scenario: Cost computed for active configuration
- **WHEN** a surface config has 3 blocks in left-prompt and right-prompt enabled
- **THEN** total cost = sum of costs for those 3 blocks + cost for right-prompt zone
