## MODIFIED Requirements

### Requirement: BlockDefinition includes export cost map
Each `BlockDefinition` SHALL include an `exportCosts` field of type `Record<ExportTargetId, number>`. This field declares the cost of exporting this block to each known target. Absent entries default to 0 (native support). All blocks currently in the registry SHALL declare cost 0 for both `bash-ps1` and `powershell-prompt`.

#### Scenario: Default export cost for standard blocks
- **WHEN** the registry is loaded
- **THEN** every block has `exportCosts["bash-ps1"] === 0` and `exportCosts["powershell-prompt"] === 0`

#### Scenario: Missing target key defaults to zero
- **WHEN** a block's exportCosts does not include a given target id
- **THEN** the cost is treated as 0 by the export cost aggregation logic
