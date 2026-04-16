## ADDED Requirements

### Requirement: Stacked scenario preview
The system SHALL render a live preview pane showing the active surface configuration rendered against all scenario presets for that surface simultaneously. Scenarios SHALL be displayed as stacked rows in a scrollable panel. An empty line SHALL separate each scenario row.

#### Scenario: Preview updates on block change
- **WHEN** the user adds, removes, or reorders a block in any zone
- **THEN** all scenario rows in the preview update immediately to reflect the new configuration

#### Scenario: Preview updates on style change
- **WHEN** the user changes a block's style preset
- **THEN** all scenario rows update immediately

#### Scenario: Preview updates on theme change
- **WHEN** the user selects a different theme
- **THEN** all scenario rows re-render with the new theme's colors

#### Scenario: Preview updates on layout change
- **WHEN** the user changes a zone's layout type or layout config
- **THEN** all scenario rows update immediately

### Requirement: Scenario row layout
Each scenario row SHALL display: a fixed-width muted label column (~12 characters) showing the scenario name, followed by the left-prompt zone rendered spans, followed by the right-prompt zone rendered spans right-aligned on the same line. Row content SHALL be non-wrapping (`whitespace-nowrap`) with horizontal scroll if the rendered prompt exceeds the panel width.

#### Scenario: Left and right prompt on one line
- **WHEN** both left-prompt and right-prompt zones have blocks configured
- **THEN** both render on the same row: left prompt on the left, right prompt pushed to the far right

#### Scenario: Empty right prompt zone
- **WHEN** the right-prompt zone has no blocks
- **THEN** only the left prompt renders; no empty space is reserved on the right

#### Scenario: Long prompt horizontal scroll
- **WHEN** the rendered prompt content exceeds the preview panel width
- **THEN** the row scrolls horizontally rather than wrapping

### Requirement: Multiline prompt preview
When the active surface config has `globalOptions.multiline` set to `true`, each scenario row SHALL render on two lines: line 1 contains the block content from the left-prompt zone and the right-prompt zone (right-aligned); line 2 contains the prompt character from `globalOptions["prompt-char"]` (defaulting to `❯`) followed by a cursor indicator.

#### Scenario: Single-line mode
- **WHEN** `globalOptions.multiline` is `false` or absent
- **THEN** each scenario renders as one line: left-prompt blocks followed by the prompt character, with right-prompt right-aligned

#### Scenario: Multiline mode
- **WHEN** `globalOptions.multiline` is `true`
- **THEN** each scenario renders as two lines: line 1 has block content and right-prompt; line 2 has the prompt character

### Requirement: Continuation zone conditional rendering
The continuation-prompt zone SHALL only render in scenario rows where `scenario.data.multilineCommand` is `true`. For all other scenarios the continuation zone row is omitted entirely.

#### Scenario: Continuation zone hidden in standard scenarios
- **WHEN** a scenario does not have `multilineCommand: true`
- **THEN** the continuation-prompt zone does not appear in that scenario's row

#### Scenario: Continuation zone shown in multiline-command scenario
- **WHEN** a scenario has `multilineCommand: true` and the continuation-prompt zone is enabled with blocks
- **THEN** the continuation prompt renders as a second line below the main prompt line for that scenario
