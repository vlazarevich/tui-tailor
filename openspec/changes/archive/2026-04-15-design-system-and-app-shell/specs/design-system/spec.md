## ADDED Requirements

### Requirement: Theme token system with semantic color slots
The system SHALL define a set of semantic color slots (surface, text, semantic, accent, border categories) as CSS custom properties. All UI elements SHALL reference these tokens — no hardcoded hex values in components.

#### Scenario: Theme tokens are applied globally
- **WHEN** the app renders
- **THEN** all colors in the UI are derived from CSS custom properties defined on a root container

#### Scenario: Adding a new theme
- **WHEN** a contributor adds a new theme preset
- **THEN** they only need to define values for the semantic color slots — no component changes required

### Requirement: Popular theme presets
The system SHALL include at least three built-in theme presets: Catppuccin Mocha, Tokyo Night, and Dracula. Each preset SHALL define values for all semantic color slots.

#### Scenario: Default theme
- **WHEN** the app loads with no saved preference
- **THEN** the Catppuccin Mocha theme is applied

#### Scenario: Theme preset defines all required slots
- **WHEN** any built-in theme preset is selected
- **THEN** every semantic color slot has a defined value and no UI element renders with a missing/fallback color

### Requirement: Theme switcher
The system SHALL provide a theme picker as a dropdown select that allows the user to switch between available theme presets. Switching themes SHALL update both the app chrome and any preview areas immediately.

#### Scenario: User switches theme
- **WHEN** the user selects a different theme from the theme picker
- **THEN** all UI colors update to reflect the new theme within the same render cycle
- **AND** the theme choice is persisted (see persistence capability)

### Requirement: TUI visual language
The system SHALL use a monospace font stack for all text. Visual hierarchy SHALL be conveyed through color intensity and outline/background style, not font size variation. All text SHALL render at a single base size (16px). The app title in the toolbar is the sole exception where accent color distinguishes it.

#### Scenario: Consistent monospace rendering
- **WHEN** the app renders on a system with any of the supported monospace fonts installed
- **THEN** all text renders in a monospace font

#### Scenario: Single font size
- **WHEN** comparing any two text elements in the UI (headers, labels, body text, buttons, inputs)
- **THEN** they render at the same font size (16px)
- **AND** visual hierarchy is conveyed through color, opacity, uppercase, or background — never font size

### Requirement: Terminal-grid spacing system
All spacing SHALL align to a terminal character grid. Horizontal spacing uses `ch` units so monospaced text aligns vertically across rows. Vertical spacing uses multiples of the line-height (24px) to simulate terminal row boundaries.

#### Scenario: Horizontal padding on inner content
- **WHEN** an element has horizontal padding (buttons, inputs, panels, status bar)
- **THEN** the padding is specified in `ch` units (1ch for inner elements, 2ch for outer containers)

#### Scenario: Vertical padding — single-row element
- **WHEN** an element represents a single terminal row (status bar, section headers, inline items, buttons, inputs)
- **THEN** it has `py-0` (no vertical padding) and its height equals one line-height (24px)

#### Scenario: Vertical padding — border-row spacing
- **WHEN** a structural border separates content areas (toolbar top/bottom)
- **THEN** padding is half the line-height (12px / `py-3`) so the border visually occupies its own terminal row

#### Scenario: Vertical gaps between sections
- **WHEN** vertical space separates distinct sections or panels
- **THEN** the gap is one full line-height (24px / `gap-6`, `my-6`, `py-6`)

### Requirement: Line height consistency
The base line-height SHALL be 1.5 (24px at 16px font size) and SHALL apply uniformly to all elements including form controls (inputs, selects, buttons). Browser default line-height overrides on form elements SHALL be explicitly reset.

#### Scenario: Form control line height
- **WHEN** a select, input, or button renders
- **THEN** its line-height matches the global 1.5 value, not the browser default

### Requirement: Letter spacing consistency
Letter spacing SHALL be uniform across all text elements. No element SHALL use modified letter-spacing (e.g., `tracking-wider`), so that characters align vertically across adjacent rows in the monospace grid.

#### Scenario: Vertical character alignment
- **WHEN** two text elements are stacked vertically
- **THEN** their characters align to the same horizontal positions

### Requirement: Outline vs border convention
Structural layout boundaries (toolbar, status bar, panel separators) SHALL use CSS `border`. Inner elements (buttons, inputs, selects, panels within the canvas, zone boxes) SHALL use CSS `outline` so they do not affect layout calculations or element sizing.

#### Scenario: Structural border
- **WHEN** a boundary separates major layout regions (toolbar from content, content from status bar, catalog panel from canvas)
- **THEN** it uses `border` (e.g., `border-y`, `border-t`, `border-r`, `border-b`)

#### Scenario: Inner element outline
- **WHEN** a button, input, select, zone panel, or options panel needs a visible boundary
- **THEN** it uses `outline outline-1` instead of `border`
- **AND** its dimensions are not affected by the outline

#### Scenario: Active/focus state on outlined elements
- **WHEN** an outlined element is active or focused
- **THEN** the outline color changes to the accent color (`outline-accent`)

### Requirement: Tailwind CSS integration
The system SHALL use Tailwind CSS v4 for all styling. Semantic theme tokens SHALL be defined via `@theme` in CSS and available as utility classes.

#### Scenario: Theme tokens available as Tailwind utilities
- **WHEN** a developer writes a component
- **THEN** they can use classes like `text-semantic-vcs`, `bg-surface-primary`, `outline-border-primary` that resolve to the current theme's values
