## ADDED Requirements

### Requirement: Bash exporter emits code by walking block captures, not per-block switch
The Bash exporter SHALL produce its output by iterating block captures defined in the registry and formatting their `bash-ps1` bindings. The exporter MUST NOT contain a per-block `switch` or a family of `generate<BlockId>Block` functions. Any block in the registry that declares a `bash-ps1` binding for each capture it uses SHALL emit correct code without exporter-side changes.

#### Scenario: Adding a new block requires no exporter change
- **WHEN** a new block is added to `src/lib/data/blocks.ts` with captures that all declare `bash-ps1` bindings
- **THEN** the Bash exporter emits correct code for that block without edits to `src/lib/exporters/bash.ts`

#### Scenario: Setup lines emit once per capture
- **WHEN** two elements of the same block reference the same capture
- **THEN** the capture's `setup` lines are emitted exactly once inside the block body

#### Scenario: Block-level guard wraps the block body
- **WHEN** every required capture of a block declares a `guard` string
- **THEN** the emitted code wraps the block body in a shell conditional that ANDs the guards

### Requirement: Output for existing configs is equivalent
The captures-driven exporter SHALL produce output equivalent to the pre-refactor exporter for all configs covered by golden-file fixtures. Equivalence means identical behavior at runtime; trivial differences in whitespace or variable-name casing are acceptable only if documented in the change log.

#### Scenario: Golden fixture parity
- **WHEN** a snapshot config from the fixtures directory is exported
- **THEN** the generated Bash produces the same runtime prompt as the pre-refactor Bash for the same scenario
