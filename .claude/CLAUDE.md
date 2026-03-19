# tui-tailor

**Type:** code / web-app
**Goal:** A static web app for customizing TUI apps and shell prompts — configure layouts, color schemes, and themes across tools like PowerShell, Bash, Starship, Oh My Posh, and more. Generates config snippets the user applies once; nothing depends on the tool after setup.
**Status:** active

## Roadmap
1. **M1 — Bash & PowerShell prompts** ← current
2. **M2 — Starship** (TOML-based, cross-shell)
3. **M3 — Oh My Posh** (JSON/TOML, Windows-first)
4. **M4+** — everything else (tmux, Zellij, Neovim, Lazygit, fzf, Claude Code statusline, …)

## Current milestone
Generate config snippets for **Bash** (`PS1` in `~/.bashrc`) and **PowerShell** (`Prompt` function in `$PROFILE`).

Deliverable: web UI where user picks segments (user, host, cwd, git branch, exit code) and colors, sees an approximate preview, and gets copyable instructions with per-OS/shell guidance on where to apply them.

## Constraints and decisions

### Delivery: static web app
- Hosted on **GitHub Pages** (free, no backend, reliable)
- **No curl | bash**, no install step — user copies generated config text manually
- Config state persisted in **localStorage** (survives tab close, enables iterative refinement)
- Themes shareable via **URL fragment** (`#config=base64...`) — fragment never hits the server

### Future CLI (if users ask for it)
Not in scope. If built later, it could consume the same config schema. Design the schema cleanly but don't optimise for this now.

### Preview strategy
- **M1 (Bash/PowerShell):** approximate preview with dark/light toggle — good enough
- **Per tool going forward:** decide case-by-case whether a live preview is feasible or whether a static approximate render with a caveat is the right call
- Preview accuracy is a first-class concern as tool count grows — don't let it erode trust

### Application UX
- Web app shows generated config text + step-by-step instructions (branching per OS/shell where needed)
- Modern tools (Starship, Oh My Posh, etc.) have standardised config locations — less branching needed there
