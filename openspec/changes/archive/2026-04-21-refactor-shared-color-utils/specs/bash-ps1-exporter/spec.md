## ADDED Requirements

### Requirement: Auto-contrast matches the preview's WCAG formula
When the Bash exporter emits a foreground color chosen by auto-contrast against a background (used for powerline/powertab icon regions), it SHALL use the same WCAG 2.x relative-luminance contrast ratio that `src/lib/renderer.ts` uses for the browser preview. The exporter SHALL NOT ship its own divergent formula.

#### Scenario: Exported auto-contrast agrees with preview at a mid-luminance slot
- **WHEN** a packaged theme has a slot whose background hex sits near the WCAG crossover (e.g. a mid-grey `vcs` color)
- **THEN** the color the preview picks for that slot's icon foreground equals the color the Bash exporter writes to `_TT_<SLOT>_FG`

#### Scenario: Single canonical implementation
- **WHEN** the Bash exporter decides between black and white for an auto-contrast foreground
- **THEN** it invokes the shared `autoContrast` utility in `src/lib/color.ts` rather than a local copy
