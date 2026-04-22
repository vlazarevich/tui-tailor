## ADDED Requirements

### Requirement: Block captures carry per-target shell bindings
Each `BlockDefinition` SHALL define a `captures: Record<string, CaptureDefinition>` map. Each capture represents a single piece of data the block needs at render time. A `CaptureDefinition` SHALL provide:
- `scenario: (data: ScenarioData) => string | number | boolean | undefined` — used by the browser preview to read a value from scenario data.
- `targets: Record<TargetId, TargetCaptureBinding>` — per-target bindings where each `TargetCaptureBinding` has `setup: string[]`, `ref: string`, and `guard: string`, all treated as opaque strings in the target's dialect.

#### Scenario: git-branch defines a branch capture
- **WHEN** the `git-branch` block is retrieved from the registry
- **THEN** it defines a capture named `branch` whose `scenario` reads `data.branch`, whose `bash-ps1` binding carries a `setup` that runs `git branch --show-current`, a `ref` of `$_branch`, and a `guard` of `[[ -n "$_branch" ]]`

#### Scenario: Capture binding strings are opaque to shared code
- **WHEN** a capture's `guard` or `setup` string is consumed by the shared compose pipeline
- **THEN** the pipeline passes the string through to the target verbatim without parsing or inspecting its contents

### Requirement: Elements reference captures instead of scenario fields
`ElementDefinition` SHALL support a `capture: string` field that names an entry in the owning block's `captures` map. Elements MAY continue to use `value: string` for static content (icons, connectors, literals). An element MUST NOT mix `capture` and `value`.

#### Scenario: Element references a capture
- **WHEN** the `git-branch` block's `branch` element is defined
- **THEN** it uses `capture: "branch"` and no longer uses a raw `source` field

#### Scenario: Static element unchanged
- **WHEN** a block's `icon` element is defined
- **THEN** it uses `value: "<glyph>"` unchanged and has no `capture` field

## REMOVED Requirements

### Requirement: Element-based block definition
**Reason**: Element-level `source`/`format` plumbing is superseded by block-level `captures`. `source` becomes `capture` (indirection through the block's capture map); `format` stays on the element.
**Migration**: For each block, lift each unique `source` into a named capture on the block; rewrite elements to reference the capture by name. Static-`value` elements are unaffected.
