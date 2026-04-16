## Context

tui-tailor is a static React/Vite web app currently structured as a tool-first prompt configurator (pick Bash or PowerShell, toggle segments, copy config). The codebase has 4 components, hardcoded Catppuccin Mocha colors in raw CSS, and a flat `Segment[]` data model.

The project is pivoting to a surface-first architecture where users compose blocks into zones on a surface (terminal prompt, vim statusline, tmux bar, etc.) and export to any compatible tool. This change lays the foundation: design system, app shell, block registry, and persistence.

## Goals / Non-Goals

**Goals:**

- Establish Tailwind CSS with a theme token system using semantic color slots
- Build a TUI-aesthetic visual language (monospace, box-drawing borders, color-driven hierarchy)
- Create the app shell layout with surface switcher, block catalog, canvas, and status bar
- Define the core data model: Surface, Zone, Block, Theme, ExportTarget
- Implement localStorage persistence per surface with auto-save
- Implement base64 config string for sharing/importing configurations

**Non-Goals:**

- Populating actual block content (that's M2 — Terminal Prompt surface)
- Building export generators (M2/M3)
- Live preview rendering (M2)
- Keyboard navigation / command palette (M5)
- Virtual scrolling optimization (M5)
- Any backend or API

## Decisions

### 1. Tailwind CSS as styling framework

**Choice:** Tailwind CSS v4 with CSS custom properties for theme tokens.

**Why over alternatives:**

- vs. CSS Modules: Tailwind's utility-first approach is faster for prototyping and keeps styles co-located with markup. The TUI aesthetic needs consistent spacing/color application — utilities enforce this.
- vs. styled-components/Emotion: No runtime CSS-in-JS overhead. Tailwind's static extraction is better for a GitHub Pages static site.
- vs. raw CSS (current): Won't scale. Already seeing repetitive color/spacing values.

Theme tokens are CSS custom properties (`--color-surface-primary`, `--color-text-vcs`, etc.) referenced via Tailwind's theme configuration. Switching themes swaps the property values on `:root`.

### 2. Semantic theme slots, not per-block colors

**Choice:** Blocks reference semantic slots (`vcs`, `path`, `host`, `info`, `error`, `muted`, etc.). Themes define what each slot resolves to.

**Why:** Decouples blocks from palettes entirely. Adding a new theme is just defining ~15 color values. Blocks never mention hex colors. The two orthogonal axes (theme = colors, style preset = information density) stay clean.

**Slot categories:**

- Surface: `surface-primary`, `surface-secondary`, `surface-elevated`, `surface-terminal`
- Text: `text-primary`, `text-secondary`, `text-muted`
- Semantic: `color-vcs`, `color-path`, `color-host`, `color-user`, `color-error`, `color-warning`, `color-info`, `color-success`
- Accent: `color-accent`, `color-accent-muted`
- Border: `border-primary`, `border-muted`

### 3. Component architecture

**Choice:** Flat component structure, no component library.

```
src/
  components/
    AppShell.tsx          — top-level layout (toolbar, panels, status bar)
    SurfaceSwitcher.tsx   — surface selection tabs
    BlockCatalog.tsx      — searchable/filterable block list
    Canvas.tsx            — zone-based block composition area
    ZoneEditor.tsx        — single zone within the canvas (drop target, reorder)
    BlockCard.tsx         — block representation in catalog and canvas
    BlockInlineEditor.tsx — inline style preset selector when block is selected
    StatusBar.tsx         — bottom bar with summary info
    ThemePicker.tsx       — theme/palette selector
  lib/
    types.ts              — Surface, Zone, Block, Theme, ExportTarget, etc.
    registry.ts           — block registry (all block definitions)
    themes.ts             — theme definitions (palette presets)
    surfaces.ts           — surface definitions (zones, compatible blocks)
    persistence.ts        — localStorage read/write, base64 encode/decode
```

**Why flat:** The app is a single-page composer. Deep nesting (e.g., `components/canvas/zone/block/`) adds navigation friction for ~12 files. If it grows past 20 components, revisit.

### 4. State management: React context + useReducer

**Choice:** A single `ComposerContext` with `useReducer` for the active surface configuration. No external state library.

**Why:**

- The state shape is well-defined: `{ activeSurface, zones: Record<ZoneId, BlockInstance[]>, theme, globalOptions }`
- Actions are discrete: `ADD_BLOCK`, `REMOVE_BLOCK`, `REORDER_BLOCK`, `SET_STYLE`, `SET_THEME`, `SWITCH_SURFACE`
- Auto-save to localStorage fires on every state change (debounced)
- No async data fetching — everything is local. Redux/Zustand would be overhead.

### 5. Block registry as static data

**Choice:** Block definitions are TypeScript objects in `registry.ts`, not fetched or dynamically loaded.

```typescript
const GIT_BRANCH: BlockDefinition = {
  id: "git-branch",
  name: "Git Branch",
  category: "git",
  surfaces: ["terminal-prompt", "vim-statusline", "claude-code"],
  styles: {
    zen: { format: "{branch}", icon: false },
    minimal: { format: " {branch}", icon: true },
    extended: { format: " {branch} {ahead}{behind}", icon: true },
  },
  themeSlot: "vcs",
  defaultStyle: "minimal",
};
```

**Why:** The catalog is curated, not user-generated. Static definitions enable tree-shaking, type safety, and zero-latency catalog rendering. New blocks are added by contributors via PRs.

### 6. Persistence: localStorage + base64 config string

**Choice:** Two persistence mechanisms, both client-side.

- **Auto-save:** On every state change (debounced 500ms), serialize the active surface config to `localStorage` keyed by surface ID (`tui-tailor:terminal-prompt`, etc.)
- **Share:** A "Copy config" action serializes the current surface config to a base64 string. Users paste it into an import field, share via pastebin, or include it as a comment in their exported config file.

**Schema:** The serialized config includes: surface ID, zone block lists (block IDs + style choices), theme ID, global options. It does NOT include block definitions (those are in the registry).

### 7. TUI visual language

**Choice:** Monospace font throughout, terminal-grid spacing, color as the primary visual hierarchy tool.

**Typography:**

- Font: system monospace stack (`ui-monospace, 'Cascadia Code', 'Fira Code', Menlo, Monaco, monospace`)
- Single font size: 16px everywhere — no font-size variation for hierarchy
- Line-height: 1.5 (24px) globally, explicitly reset on form controls
- No letter-spacing variation — uniform tracking so characters align vertically
- Visual hierarchy via: color intensity, opacity, uppercase, background — never font size

**Spacing — terminal character grid:**

- Horizontal: always in `ch` units (1ch inner, 2ch outer) so monospace text aligns vertically
- Vertical padding: 0 (single row), 12px/py-3 (half line-height, border row), 24px/py-6 (full line-height, prominent)
- Vertical gaps: 24px (full line-height) between sections
- All spacing aligns to the terminal row grid

**Borders vs outlines:**

- Structural layout boundaries (toolbar, status bar, panel separators): CSS `border`
- Inner elements (buttons, inputs, selects, zone panels, option panels): CSS `outline` — does not affect layout sizing
- Active/focus states: outline color changes to accent

**Section headers:** muted color, uppercase, no extra spacing — single terminal row
**Active/selected states:** accent outline color + optional background fill

## Risks / Trade-offs

**[Tailwind v4 maturity]** → Tailwind v4 is relatively new. If we hit edge cases, can fall back to v3 which is stable. The CSS custom properties approach works with both.

**[Block registry scaling]** → Static TypeScript block definitions in a single file will get large (100+ blocks). → Split into per-category files (`blocks/git.ts`, `blocks/languages.ts`, etc.) when it exceeds ~50 blocks. Keep a barrel export in `registry.ts`.

**[No drag-and-drop library chosen yet]** → Canvas reorder needs DnD. Options: `@dnd-kit/core` (lightweight, accessible), HTML5 drag API (no dependency, rougher UX), or simple up/down buttons (simplest, least polished). → Defer DnD library choice to implementation. Start with up/down buttons, add DnD as enhancement.

**[Theme switching performance]** → Swapping CSS custom properties on `:root` triggers full repaint. For ~15 properties this is negligible. If themes grow to 50+ tokens, consider scoping to a container element.

**[Base64 config size]** → A surface with 20 blocks, each with a style choice, plus theme and options, serializes to roughly 500-800 bytes → ~700-1100 chars base64. Manageable for clipboard/pastebin. If it grows, consider compression (lz-string) later.
