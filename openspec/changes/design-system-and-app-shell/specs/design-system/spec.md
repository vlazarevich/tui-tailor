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
The system SHALL provide a theme picker that allows the user to switch between available theme presets. Switching themes SHALL update both the app chrome and any preview areas immediately.

#### Scenario: User switches theme
- **WHEN** the user selects a different theme from the theme picker
- **THEN** all UI colors update to reflect the new theme within the same render cycle
- **AND** the theme choice is persisted (see persistence capability)

### Requirement: TUI visual language
The system SHALL use a monospace font stack for all text. Visual hierarchy SHALL be conveyed through color intensity and border style, not font size or padding variation. Panel borders SHALL use a box-drawing aesthetic.

#### Scenario: Consistent monospace rendering
- **WHEN** the app renders on a system with any of the supported monospace fonts installed
- **THEN** all text renders in a monospace font

#### Scenario: No font-size hierarchy
- **WHEN** comparing section headers to body text
- **THEN** headers use color/opacity differentiation, not larger font sizes (h1 title is the sole exception)

### Requirement: Tailwind CSS integration
The system SHALL use Tailwind CSS for all styling. The Tailwind configuration SHALL extend with the semantic theme tokens so they are available as utility classes.

#### Scenario: Theme tokens available as Tailwind utilities
- **WHEN** a developer writes a component
- **THEN** they can use classes like `text-theme-vcs`, `bg-theme-surface-primary`, `border-theme-border-primary` that resolve to the current theme's values
