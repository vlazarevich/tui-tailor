# tui-tailor

**Type:** code / web-app
**Goal:** A visual composer for TUI surfaces (terminal prompts, statuslines, tab bars). Users pick a surface, compose blocks into zones, preview the result, and export to their tool of choice (Bash, Starship, Oh My Posh, lualine, etc.). Static web app — no backend, no install step.
**Status:** active

## Architecture: surface-first model

The primary axis is the **surface** (what you're customizing), not the tool (how you export).

- **Surface** — a customizable UI region: terminal prompt, tmux status bar, neovim statusline, etc.
- **Zone** — an ordered region within a surface (e.g., left prompt, right prompt). Each zone holds an ordered list of blocks.
- **Block** — a unit of information (git_branch, cwd, node_version, etc.). Blocks belong to categories and declare which surfaces they're compatible with. Each block has style presets (zen/minimal/extended) rather than granular per-option controls.
- **Theme** — a color palette with semantic slots (vcs, path, host, etc.). Blocks reference theme slots, not raw colors. Includes popular presets: Catppuccin, Tokyo Night, Dracula, etc. App chrome and preview share the same theme.
- **Export target** — a tool-specific output format (bash PS1, starship.toml, omp.json, lualine.lua, etc.). Each block×target combination has an integer cost (0=native, 100=not feasible). During export, the app recommends the lowest-cost target and explains tradeoffs.

## Roadmap
1. **M1 — Foundation** ← current
   - Design system (Tailwind, theme tokens, TUI aesthetic — monospace, box-drawing, color-driven hierarchy)
   - App shell (surface switcher, zone-based canvas, block catalog with search/filter)
   - Block registry architecture
   - Persistence (localStorage auto-save per surface, shareable base64 config string)
2. **M2 — Terminal Prompt** (first surface)
   - Block catalog for terminal prompts (essential, environment, cloud, status categories)
   - Zone support (left prompt, right prompt)
   - Live preview with configurable scenarios (home dir, git repo, node project, python project, error)
   - Export: raw Bash PS1, PowerShell Prompt function
3. **M3 — Starship & Oh My Posh export**
   - Additional export targets for the Terminal Prompt surface
   - Export cost model with recommendations
   - starship.toml and omp.json generators
4. **M4 — Additional surfaces**
   - Neovim statusline, tmux status bar, Claude Code statusline, Zellij tab bar
   - Surface-specific blocks and zones
   - Surface-specific export targets
5. **M5+ — Polish & community**
   - More themes, more blocks, env_var custom block
   - Keyboard navigation / command palette
   - Performance (virtual scrolling for large catalogs)

## Constraints and decisions

### Delivery: static web app
- Hosted on **GitHub Pages** (free, no backend, reliable)
- **No curl | bash**, no install step — user copies generated config text manually
- Config state persisted in **localStorage** per surface (survives tab close, enables iterative refinement)
- Config shareable as base64 string (can be pasted, included as comment in exported config, shared via pastebin)

### Styling: Tailwind + TUI aesthetic
- **Tailwind CSS** for all styling
- TUI look & feel: monospace fonts, box-drawing borders, color-driven visual hierarchy (not font sizes/padding)
- No CRT/scanline effects — modern terminal aesthetic

### Block design philosophy
- Curated style presets per block (e.g., zen/minimal/extended) — not granular knobs
- Style controls information density; theme controls colors — two orthogonal axes
- Blocks reference semantic theme slots, not raw hex values

### Export cost model
- Each block×export-target has an integer cost (0=native built-in, 50=custom script, 100=not feasible)
- Total cost = sum of individual block costs for a given target
- App recommends lowest-cost target and explains why
- Simple sum for now; revisit combinatorial effects later if needed

### Preview strategy
- Live preview with multiple configurable scenarios per surface
- Preview accuracy is a first-class concern — don't let it erode trust

### Future CLI (if users ask for it)
Not in scope. If built later, it could consume the same config schema. Design the schema cleanly but don't optimise for this now.
