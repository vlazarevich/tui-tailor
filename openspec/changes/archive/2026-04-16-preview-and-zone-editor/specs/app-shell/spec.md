## MODIFIED Requirements

### Requirement: App shell layout
The system SHALL render a structured layout with these regions: a top toolbar, a block catalog panel (left column, fixed width), a center column split vertically between zone editors (top) and a live preview pane (bottom), a full-height export panel (right column, fixed width), and a bottom status bar. The layout SHALL fill the viewport height. The center column's two sections SHALL each independently scroll.

#### Scenario: Initial render
- **WHEN** the app loads
- **THEN** the toolbar, block catalog, zone editors, preview pane, export panel, and status bar are all visible without scrolling on a standard viewport (1280x720 or larger)

## REMOVED Requirements

### Requirement: Block inline editor
**Reason**: Replaced by the tag-based block popup in the zone-editor-tags capability. Style selection and block management now happen in a popup anchored to the block's tag, not via inline expansion in the zone list.
**Migration**: No user-facing migration needed. The popup exposes the same style preset choices previously shown inline.
