## ADDED Requirements

### Requirement: Zones declare per-target bindings
Each `ZoneDefinition` SHALL include a `targetBindings: Record<TargetId, ZoneTargetBinding>` map. Each entry describes how the zone maps into the named target's output in that target's own vocabulary. A `ZoneTargetBinding` SHALL carry at least a `slot: string` field and MAY carry a `strategy: string` and additional target-specific fields.

#### Scenario: Terminal-prompt zones declare bash bindings
- **WHEN** inspecting the `terminal-prompt` surface in `src/lib/data/surfaces.ts`
- **THEN** each of its zones (`left-prompt`, `right-prompt`, `continuation-prompt`) declares a `bash-ps1` binding with `slot` set to `PS1`, `PS1` (with `strategy: "ansi-cursor"`), and `PS2` respectively

#### Scenario: Terminal-prompt zones declare powershell bindings
- **WHEN** inspecting the same surface
- **THEN** each zone declares a `powershell-prompt` binding appropriate to PowerShell's prompt model
