# tui-tailor

A visual composer for TUI surfaces — terminal prompts, statuslines, tab bars. Pick a surface, compose blocks into zones, preview the result, and export to your tool of choice.

No install. No backend. Runs entirely in the browser.

## What it does

- **Surface-first model** — customize by what you're styling (terminal prompt, tmux bar, neovim statusline), not by which tool you use
- **Block catalog** — add blocks (git branch, cwd, node version, etc.) into zones; each block has style presets (zen / minimal / extended)
- **Live preview** — see your prompt rendered across scenarios (home dir, git repo, node project, error state) simultaneously
- **Theme system** — semantic color slots (vcs, path, host, …) with presets: Catppuccin, Tokyo Night, Dracula, and more
- **Export** — generates config for Bash PS1, Starship, Oh My Posh, lualine, and others; recommends the lowest-cost target per your block set
- **Persistence** — auto-saves to localStorage; share configs as base64 strings

## Stack

- React 19 + TypeScript
- Tailwind CSS v4
- Vite
- Static deployment (GitHub Pages)

## Development

```bash
pnpm install
pnpm dev
```

```bash
pnpm build    # type-check + bundle
pnpm preview  # serve the production build locally
```

## Domain model

The system is organized around these core concepts:

**Surface** — a customizable UI region (e.g. terminal prompt, tmux status bar, neovim statusline). The primary axis of the app: users pick a surface first, then configure it. Each surface declares its zones and global options (e.g. `multiline`, `prompt-char`).

**Zone** — an ordered region within a surface (e.g. `left-prompt`, `right-prompt`, `continuation-prompt`). Each zone holds an ordered list of block instances and a layout type. Zones may be optional — users can enable/disable them independently. Each zone also declares per-target bindings (e.g. `{ slot: "PS1" }` for Bash) that the exporters use to route output without hardcoding zone IDs.

**Block** — a unit of information rendered in a zone (e.g. `git-branch`, `cwd`, `node-version`). Blocks declare:
- **Elements** — named sub-parts with a role (`content`, `icon`, `connector`), a capture reference or static value, an optional format template, and an optional theme sub-slot.
- **Captures** — named data dependencies, each with a `scenario` resolver (for browser preview) and per-target bindings (`setup`, `ref`, `guard` strings in the target's shell dialect).
- **Style presets** — named templates (`zen` / `minimal` / `extended`) using `{elementName}` tokens that control which elements appear and in what order.
- **Export costs** — per-target integers (0 = native, 100 = not feasible) used to recommend the lowest-cost export path.

**Theme** — a palette of semantic color slots (`vcs`, `path`, `host`, `border`, `muted`, …). Blocks reference slots, not raw colors. Sub-slots (e.g. `vcs-ahead`, `vcs-dirty`) allow fine-grained coloring and fall back to their parent slot when undefined. App chrome and preview share the same theme.

**Scenario** — a named snapshot of terminal context data (branch, cwd, exit code, node version, etc.) used to drive the live preview. Multiple scenarios render simultaneously as stacked rows.

**Export target** — a tool-specific output format (`bash-ps1`, `powershell-prompt`, `starship.toml`, …). Each target has block and zone cost maps. The app recommends the lowest-cost target for the active configuration and surfaces warnings for high-cost zones or blocks.

## Rendering pipeline

Block output is produced through a strict four-stage pipeline:

```
Emit → Select → Arrange → Paint
```

1. **Emit** — resolves a block's element definitions against scenario data (or export-target capture bindings) to produce an element bag. Format templates (`↑{}`) are applied here. Elements missing from the scenario resolve to empty string.

2. **Select** — applies the block's active style preset template to the element bag, producing an ordered span list. Empty elements are dropped and adjacent literal spans collapse. Blocks where all source-based elements are empty are marked not-visible and excluded from the next stage.

3. **Arrange** (`src/lib/compose/arrange.ts`) — combines visible block spans into a final render span sequence using the zone's layout type:
   - **plain** — blocks joined by a gap string
   - **flow** — connector elements prepended to each block's content
   - **brackets** — each block wrapped in open/close characters with padding
   - **powerline** — blocks rendered with bg = block theme slot; separator glyphs transition between slot colors
   - **powertab** — icon elements get colored bg tab; content elements use default bg with fg from theme slot

4. **Paint** — resolves semantic color references (`vcs`, `auto-contrast`, `muted`, `border`) to concrete CSS hex values using the active theme. `auto-contrast` computes a WCAG 2.x compliant foreground against the resolved background color.

The Bash exporter walks the same pipeline via the shared arrange IR, consuming capture `bash-ps1` bindings instead of scenario data. Any block that declares capture bindings for a target exports correctly without exporter-side changes.

## Architecture

```
src/
  lib/
    types.ts              # Surface, Zone, Block, Theme, Scenario, ExportTarget types
    composerContext.ts    # React context handle for global composer state
    ComposerProvider.tsx  # Context provider — state and dispatch
    renderer.ts           # Browser preview entry — emit (stage 1), paint (stage 4), renderZone convenience
    applyTheme.ts         # Applies active theme CSS variables to the document
    blockHelpers.ts       # Block instance utility helpers
    color.ts              # Shared color utils — autoContrast, hex↔rgb, WCAG luminance
    persistence.ts        # localStorage auto-save/load per surface + base64 config share
    compose/
      ir.ts               # SelectSpan, BlockSpans, ArrangedZone and other pipeline IR types
      select.ts           # Select stage (2) — style template → ordered spans
      arrange.ts          # Arrange stage (3) — zone layout types (plain/flow/brackets/powerline/powertab)
    data/
      blocks.ts           # Block registry — all block definitions with captures, elements, styles
      surfaces.ts         # Surface definitions — zones, global options, per-target zone bindings
      themes.ts           # Theme presets and semantic slot mapping
      exportTargets.ts    # Export target definitions — block costs, zone costs
      scenarios.ts        # Preview scenario presets per surface
    exporters/
      index.ts            # Exporter dispatch
      bash.ts             # Bash PS1 exporter (consumes arrange IR, emits shell code sections)
      powershell.ts       # PowerShell Prompt function exporter
  components/
    AppShell.tsx          # Top-level layout (toolbar / catalog / canvas+preview / export / statusbar)
    SurfaceSwitcher.tsx   # Surface selector in toolbar
    Canvas.tsx            # Zone-based canvas (zone editors stacked vertically)
    ZoneEditor.tsx        # Zone header, block tag list, layout picker, enable/disable control
    BlockTag.tsx          # Individual block tag with gear icon and style label
    BlockCatalog.tsx      # Categorized block list with search filter
    BlockPopup.tsx        # Block detail popup — style preset picker, reorder, zone transfer, remove
    PreviewPane.tsx       # Live preview — stacked scenario rows, multiline and continuation support
    ThemePicker.tsx       # Theme selector
    ExportPanel.tsx       # Export target selector, cost display, generated code sections
    ExportPopup.tsx       # Export detail popup
    ConfigShare.tsx       # Base64 config export/import
    StatusBar.tsx         # Bottom bar — active surface, block count, theme name
```

The primary axis is the **surface**. Each surface declares its zones and global options. Blocks declare which surfaces they're compatible with, and carry per-target capture bindings and cost maps. The four-stage pipeline is the single path from block definitions to both browser preview and exported shell code — exporters reuse the same arrange IR rather than duplicating layout logic.

## Persistence

- Surface configs auto-save to localStorage under `tui-tailor:<surface-id>` (debounced 500ms).
- Active theme persists under `tui-tailor:theme`.
- Configs are shareable as base64 strings encoding surface ID, zone layout types, block lists with style choices, theme ID, and global options (not full block definitions).
- On load, the last active surface and its config are restored automatically.

## Export cost model

Each block×target pair carries an integer cost (0 = native built-in, 100 = not feasible; values between indicate degraded or partial support). Zone×target pairs also carry costs (e.g. `right-prompt` in Bash PS1 has cost 75 due to cursor-positioning workaround). Total cost = sum of active block costs + active zone costs. The export panel recommends the lowest-cost target and surfaces warnings for high-cost zones or blocks.

## Roadmap

| Milestone | Status |
|-----------|--------|
| M1 — Foundation: design system, app shell, block registry, persistence | complete |
| M2 — Terminal Prompt: block catalog, live preview, Bash PS1 / PowerShell export | complete |
| M3 — Starship & Oh My Posh export | planned |
| M4 — Additional surfaces (neovim, tmux, Claude Code statusline, Zellij) | planned |
| M5 — Polish: keyboard nav, command palette, more themes and blocks | planned |
