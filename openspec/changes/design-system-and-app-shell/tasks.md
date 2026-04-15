## 1. Tailwind Setup & Theme Tokens

- [ ] 1.1 Install Tailwind CSS v4 and configure with Vite
- [ ] 1.2 Define semantic color slot CSS custom properties (surface, text, semantic, accent, border categories)
- [ ] 1.3 Extend Tailwind config to expose theme tokens as utility classes (e.g., `text-theme-vcs`, `bg-theme-surface-primary`)
- [ ] 1.4 Create theme preset definitions in `src/lib/themes.ts` (Catppuccin Mocha, Tokyo Night, Dracula) implementing all semantic slots
- [ ] 1.5 Implement theme application logic — switching themes swaps CSS custom property values on root container
- [ ] 1.6 Remove all existing raw CSS from `index.css` and component inline styles

## 2. Core Data Model

- [ ] 2.1 Define TypeScript types in `src/lib/types.ts`: Surface, Zone, BlockDefinition, BlockInstance, StylePreset, Theme, ExportTarget
- [ ] 2.2 Create surface definitions in `src/lib/surfaces.ts` with at least one surface (Terminal Prompt) having two zones (left-prompt, right-prompt) and global options (multiline, promptChar)
- [ ] 2.3 Create block registry in `src/lib/registry.ts` with at least 5 seed blocks across 2+ categories (e.g., Essential: user, host, cwd; Git: git_branch, git_status) — each with zen/minimal/extended style presets and themeSlot references
- [ ] 2.4 Implement `getBlocksForSurface(surfaceId)` and `getBlocksByCategoryForSurface(surfaceId)` functions in registry

## 3. State Management

- [ ] 3.1 Define state shape and action types for ComposerContext: activeSurface, zones (Record<ZoneId, BlockInstance[]>), theme, globalOptions
- [ ] 3.2 Implement useReducer with actions: ADD_BLOCK, REMOVE_BLOCK, REORDER_BLOCK, SET_STYLE, SET_THEME, SWITCH_SURFACE, SET_GLOBAL_OPTION, LOAD_CONFIG
- [ ] 3.3 Create ComposerContext provider wrapping the app, exposing state and dispatch

## 4. Persistence

- [ ] 4.1 Implement localStorage save/load functions in `src/lib/persistence.ts` — save keyed by `tui-tailor:<surface-id>`, theme keyed by `tui-tailor:theme`
- [ ] 4.2 Wire auto-save to state changes with 500ms debounce
- [ ] 4.3 Restore last active surface + config + theme on app load
- [ ] 4.4 Implement base64 config string encode/decode (surface ID, zone layouts, style choices, theme ID, global options)
- [ ] 4.5 Add import/export UI: "Copy config" button and "Paste config" input field

## 5. App Shell Layout

- [ ] 5.1 Create AppShell component with TUI-aesthetic layout: toolbar (top), block catalog (left panel), canvas (center), status bar (bottom) — all using Tailwind utilities and theme tokens
- [ ] 5.2 Implement SurfaceSwitcher in toolbar — tabs for each available surface
- [ ] 5.3 Implement ThemePicker in toolbar — dropdown or button group for theme presets
- [ ] 5.4 Implement StatusBar — displays active surface name, block count, theme name

## 6. Block Catalog

- [ ] 6.1 Implement BlockCatalog component — lists blocks grouped by category with collapsible headers, filtered by active surface
- [ ] 6.2 Add search input that filters blocks by name (instant, case-insensitive), hiding empty categories
- [ ] 6.3 Implement "add to zone" action on each catalog block (+ button) — adds block to the first zone by default, or a zone picker if multiple zones exist

## 7. Canvas & Zone Editor

- [ ] 7.1 Implement Canvas component — renders the active surface's zones as named regions
- [ ] 7.2 Implement ZoneEditor component — displays ordered block instances within a zone, with remove button and up/down reorder buttons per block
- [ ] 7.3 Implement BlockInlineEditor — clicking a block on canvas expands it to show style preset selector (zen/minimal/extended)
- [ ] 7.4 Implement global options section on canvas (e.g., multiline toggle, prompt char input for Terminal Prompt)

## 8. Cleanup & Integration

- [ ] 8.1 Remove old components (ToolSelector, SegmentEditor, Preview, ConfigOutput) and old types/generators
- [ ] 8.2 Wire App.tsx to render AppShell with ComposerContext provider
- [ ] 8.3 Verify full flow: switch surface → browse catalog → add blocks → reorder → change style → switch theme → reload (persistence) → export config string → import config string
