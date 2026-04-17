## 1. Type System

- [x] 1.1 Extend `ExportTarget` in `types.ts` with `blockCosts: Record<string, number>` and `zoneCosts: Record<string, number>`
- [x] 1.2 Add `exportCosts: Record<ExportTargetId, number>` to `BlockDefinition` in `types.ts`
- [x] 1.3 Add `CodeSection` interface to `types.ts`: `{ label: string; code: string }`

## 2. Block Registry

- [x] 2.1 Add `exportCosts: { "bash-ps1": 0, "powershell-prompt": 0 }` to every block in `registry.ts`

## 3. Export Target Registry

- [x] 3.1 Create `src/lib/exportTargets.ts` with `bash-ps1` and `powershell-prompt` target definitions
- [x] 3.2 Define `bash-ps1`: `zoneCosts: { "right-prompt": 75 }`, all block costs 0
- [x] 3.3 Define `powershell-prompt`: all zone and block costs 0
- [x] 3.4 Export `getTargetsForSurface(surfaceId: string): ExportTarget[]` helper

## 4. Bash Exporter

- [x] 4.1 Create `src/lib/exporters/bash.ts`
- [x] 4.2 Implement Colors section: collect distinct theme slots from active blocks, emit `_TT_<SLOT>` truecolor ANSI variables + `_TT_RESET`
- [x] 4.3 Implement Prompt section: emit `_tt_build_prompt()` using `PROMPT_COMMAND` append pattern
- [x] 4.4 Handle static blocks (cwd, user, host) as unconditional appends in the builder
- [x] 4.5 Handle conditional blocks (git-branch, git-status, exit-code, env versions, cloud) with subshell checks
- [x] 4.6 Handle powerline/powertab layouts: bg ANSI codes + `# Requires Nerd Font` comment
- [x] 4.7 Handle right-prompt zone with `printf "%*s\r"` cursor-positioning approach
- [x] 4.8 Apply `prompt-char` global option as terminal character; apply `multiline` as `\n` before prompt char

## 5. PowerShell Exporter

- [x] 5.1 Create `src/lib/exporters/powershell.ts`
- [x] 5.2 Implement Colors section: emit `$TtColor<Slot>` truecolor variables using `[char]27` syntax + `$TtReset`; add `# Add to $PROFILE` comment
- [x] 5.3 Implement Prompt section: emit `function Prompt { }` returning built string
- [x] 5.4 Handle static and conditional blocks (same logic as Bash, PowerShell syntax)
- [x] 5.5 Handle powerline/powertab layouts + `# Requires Nerd Font` comment
- [x] 5.6 Apply `prompt-char` and `multiline` global options

## 6. Exporter Index

- [x] 6.1 Create `src/lib/exporters/index.ts` exporting `exportSurface(config, targetId, theme): CodeSection[]`

## 7. Export Panel UI

- [x] 7.1 Replace ExportPanel sidebar placeholder with an "Export" button that opens the popup
- [x] 7.2 Create `ExportPopup` component: full-viewport overlay with backdrop, close button, Escape key handler
- [x] 7.3 Add tabbed target selector (Bash / PowerShell) inside the popup
- [x] 7.4 Render installation hint below tabs ("Add to ~/.bashrc" / "Add to $PROFILE")
- [x] 7.5 Render each `CodeSection` as a labeled read-only code block with per-section Copy button
- [x] 7.6 Add "Copy All" button that concatenates all sections with a blank line between
- [x] 7.7 Implement 2-second "Copied!" feedback on all copy buttons
- [x] 7.8 Show zone cost warning when active target has `zoneCosts[zoneId] > 0` for an enabled zone
