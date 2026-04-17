# tui-tailor

A visual composer for TUI surfaces — terminal prompts, statuslines, tab bars. Pick a surface, compose blocks into zones, preview the result, and export to your tool of choice.

No install. No backend. Runs entirely in the browser.

## What it does

- **Surface-first model** — customize by what you're styling (terminal prompt, tmux bar, neovim statusline), not by which tool you use
- **Block catalog** — drag blocks (git branch, cwd, node version, etc.) into zones; each block has style presets (zen / minimal / extended)
- **Live preview** — see your prompt rendered across scenarios (home dir, git repo, node project, error state)
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

## Architecture

```
src/
  lib/
    types.ts        # Surface, Zone, Block, Theme types
    registry.ts     # Block registry — catalog of all available blocks
    surfaces.ts     # Surface definitions (zones, global options)
    themes.ts       # Theme presets and semantic slot mapping
    renderer.ts     # Renders a composer state to a preview string
    scenarios.ts    # Preview scenarios (git repo, error, etc.)
    persistence.ts  # localStorage save/load + base64 share
    composerContext.tsx  # React context for global composer state
  components/
    AppShell.tsx    # Top-level layout
    SurfaceSwitcher.tsx
    Canvas.tsx      # Zone-based drag-and-drop canvas
    ZoneEditor.tsx
    BlockCatalog.tsx
    BlockPopup.tsx  # Block detail / style preset picker
    PreviewPane.tsx # Live preview with scenario switcher
    ThemePicker.tsx
    ExportPanel.tsx
    ConfigShare.tsx
    StatusBar.tsx
```

The primary axis is the **surface** (what you're customizing). Each surface declares its zones and global options. Blocks declare which surfaces they're compatible with and carry an integer cost per export target — the app recommends the lowest-cost export path for your current block set.

## Roadmap

| Milestone | Status |
|-----------|--------|
| M1 — Foundation: design system, app shell, block registry, persistence | complete |
| M2 — Terminal Prompt: block catalog, live preview, Bash PS1 / PowerShell export | complete |
| M3 — Starship & Oh My Posh export | planned |
| M4 — Additional surfaces (neovim, tmux, Claude Code statusline, Zellij) | planned |
| M5 — Polish: keyboard nav, command palette, more themes and blocks | planned |
