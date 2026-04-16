## ADDED Requirements

### Requirement: Tag-based block list
The zone editor SHALL display configured blocks as compact inline tags that wrap to multiple lines as needed. The tag area SHALL have full line-height padding above and below the tag list. Each tag SHALL display: a gear icon (⚙), the block name, and the active style preset name in muted text.

#### Scenario: Tags wrap to multiple lines
- **WHEN** a zone has more blocks than fit on one line
- **THEN** tags wrap to the next line; the zone editor grows in height to accommodate

#### Scenario: Tag color reflects theme slot
- **WHEN** a block tag is rendered
- **THEN** the block name text is colored using the block's theme slot color (e.g., git-branch uses the `vcs` theme color)

#### Scenario: Tag shows active style
- **WHEN** a block tag is rendered with style "extended"
- **THEN** the tag displays "git-branch · extended" (name followed by muted style name)

### Requirement: Block settings popup
Clicking the gear icon on a block tag SHALL open a popup anchored to that tag. The popup SHALL contain: a style selector showing all available presets for the block (with the active preset highlighted), left/right reorder controls, a zone-transfer control (only when other enabled zones exist), and a remove (×) control. Clicking outside the popup SHALL dismiss it.

#### Scenario: Style selection in popup
- **WHEN** the user clicks a style preset name in the popup
- **THEN** the block's style updates immediately and the popup shows the new selection highlighted

#### Scenario: Reorder left
- **WHEN** the user clicks ← in the popup and the block is not already first
- **THEN** the block moves one position left in the zone

#### Scenario: Reorder right
- **WHEN** the user clicks → in the popup and the block is not already last
- **THEN** the block moves one position right in the zone

#### Scenario: Reorder at boundary
- **WHEN** the user clicks ← and the block is first, or → and the block is last
- **THEN** the control is disabled (dimmed, non-interactive)

#### Scenario: Zone transfer
- **WHEN** the user selects a target zone from the "move to" list in the popup
- **THEN** the block is removed from the current zone and appended to the target zone

#### Scenario: Zone transfer not shown with single zone
- **WHEN** only one zone is enabled on the surface
- **THEN** the "move to" section is not shown in the popup

#### Scenario: Remove block
- **WHEN** the user clicks × in the popup
- **THEN** the block is removed from the zone and the popup closes

#### Scenario: Dismiss popup
- **WHEN** the user clicks outside the open popup
- **THEN** the popup closes without changes

### Requirement: Optional zone visibility controls
Optional zones that are disabled SHALL NOT be rendered in the zone editor. Below all active zones, the canvas SHALL display a `+` button for each disabled optional zone. Clicking `+` enables that zone. Active optional zones SHALL display an `×` control in their zone header; clicking `×` disables and hides that zone (preserving its block configuration in state).

#### Scenario: Disabled optional zone is hidden
- **WHEN** an optional zone has `enabled: false` in the surface config
- **THEN** that zone's editor is not rendered; its name appears as a `+` button below active zones

#### Scenario: Enable an optional zone
- **WHEN** the user clicks `+ right-prompt`
- **THEN** the right-prompt zone editor appears with an empty block list (or its previously configured blocks if any)

#### Scenario: Disable an optional zone
- **WHEN** the user clicks `×` in the right-prompt zone header
- **THEN** the right-prompt zone editor is hidden and its `+` button reappears below active zones

#### Scenario: Disabling preserves block config
- **WHEN** the user disables a zone that had blocks configured, then re-enables it
- **THEN** the previously configured blocks are restored
