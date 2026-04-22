## ADDED Requirements

### Requirement: PowerShell exporter emits code by walking block captures
The PowerShell exporter SHALL produce its output by iterating block captures and formatting their `powershell-prompt` bindings. The exporter MUST NOT contain a per-block `switch` or a family of `generate<BlockId>Block` functions.

#### Scenario: Adding a new block requires no exporter change
- **WHEN** a new block is added with captures that declare `powershell-prompt` bindings
- **THEN** the PowerShell exporter emits correct code without edits to `src/lib/exporters/powershell.ts`

#### Scenario: Output for existing configs is equivalent
- **WHEN** a snapshot config is exported
- **THEN** the generated PowerShell produces the same runtime prompt as the pre-refactor PowerShell for the same scenario
