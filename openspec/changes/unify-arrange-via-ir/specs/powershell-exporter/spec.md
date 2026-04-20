## ADDED Requirements

### Requirement: PowerShell exporter consumes the shared zone IR
The PowerShell exporter SHALL obtain zone layout via the shared `compose/arrange` module and SHALL NOT carry its own copies of layout logic.

#### Scenario: Powerline/powertab zones render through unified pipeline
- **WHEN** a config uses powerline or powertab layout and is exported to PowerShell
- **THEN** the generated output renders every block the preview renders, using spans produced by `compose/arrange`
