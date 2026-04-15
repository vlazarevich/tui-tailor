## Why

The current app is a naive prototype with hardcoded Catppuccin colors, inline CSS classes, a flat two-column layout, and a tool-first architecture (pick Bash or PowerShell, configure segments). This won't scale to the project's goal of supporting dozens of tools and hundreds of configurable blocks across different surfaces (terminal prompts, vim statuslines, tmux bars, etc.). We need a design system, a surface-first app shell, and the core data architecture before adding more content.

## What Changes

- **BREAKING**: Replace all existing CSS with Tailwind CSS utility classes and a theme token system
- **BREAKING**: Replace the current flat layout with a TUI-aesthetic app shell (monospace, box-drawing borders, color-driven hierarchy)
- Introduce the surface-first model: users pick a surface (e.g., "Terminal Prompt"), not a tool
- Add zone-based canvas where blocks are composed into ordered regions (left prompt, right prompt, etc.)
- Add a searchable/filterable block catalog with category grouping
- Build the block registry data model (block definitions, style presets, theme slot references, export target compatibility)
- Add theme system with semantic color slots and popular preset palettes (Catppuccin, Tokyo Night, Dracula, etc.)
- Add localStorage persistence per surface with auto-save
- Add shareable base64 config string (import/export)

## Capabilities

### New Capabilities
- `design-system`: Tailwind setup, theme tokens with semantic slots, TUI visual language (monospace, box-drawing, color hierarchy), popular palette presets
- `app-shell`: Surface switcher, zone-based canvas layout, block catalog panel with search/filter, status bar
- `block-registry`: Block data model (id, category, surfaces, style presets, theme slots), category system, surface-scoped filtering
- `persistence`: localStorage auto-save per surface, base64 config string for sharing/import

### Modified Capabilities
<!-- No existing specs to modify -->

## Impact

- All existing components (App, ToolSelector, SegmentEditor, Preview, ConfigOutput) will be replaced
- All existing CSS (index.css) will be replaced by Tailwind
- New dependency: Tailwind CSS
- Types in lib/types.ts will be redesigned around the surface/zone/block model
- Generators (bash.ts, powershell.ts) are not touched in this change — they'll be adapted when M2 adds the Terminal Prompt surface content
