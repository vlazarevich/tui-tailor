## Context

The app has a fully working render pipeline: `emit → select → arrange → paint`. The `paint` stage resolves semantic theme slots to CSS hex values for browser display. Export needs a different final stage — instead of hex-to-CSS, it produces shell syntax (ANSI escape sequences, variable declarations, function bodies).

The `ExportPanel` currently renders a placeholder. `ExportTarget` type exists in `types.ts` but has no implementation. `BlockDefinition` has no cost data.

## Goals / Non-Goals

**Goals:**
- Functional Bash and PowerShell export for `terminal-prompt`
- Cost model on block and zone (extensible for future targets)
- Clean generated code users are happy to put in their dotfiles
- UI that's clear about what to copy and where

**Non-Goals:**
- 256-color fallback (truecolor only)
- Download-to-file (clipboard copy only for now)
- zsh-specific `$RPROMPT` (Bash cursor-positioning approach for right-prompt)
- Export for surfaces other than `terminal-prompt`

## Decisions

### 1. Reuse emit/select/arrange; replace paint with serialize

The renderer pipeline's first three stages are pure data transformation with no display coupling. The new exporter reuses them and adds a `serialize` stage that produces shell code instead of CSS spans.

```
emit(block, scenario) → elements
select(template, elements) → spans  
arrange(blockSpansList, layout) → renderSpans
serialize(renderSpans, theme, target) → string   ← new
```

Alternative considered: build a separate pipeline from scratch. Rejected — the existing stages already handle conditional visibility, layout assembly, and block-level span grouping correctly.

### 2. PROMPT_COMMAND builder for Bash (not inline PS1)

```bash
# Generated output structure:
_TT_CWD='\[\e[38;2;137;180;250m\]'   # colors section
_TT_RESET='\[\e[0m\]'

_tt_build_prompt() {                  # builder section
  local _ps1=""
  _ps1+="${_TT_CWD}\w${_TT_RESET} "
  local _branch; _branch=$(git branch --show-current 2>/dev/null)
  [[ -n "$_branch" ]] && _ps1+="..."
  PS1="${_ps1}❯ "
}
PROMPT_COMMAND=_tt_build_prompt
```

Inline `PS1='...$(...)'` spawns subshells on every prompt display and can't conditionally omit blocks. `PROMPT_COMMAND` evaluates once, supports conditionals, and produces readable code.

### 3. PowerShell uses `function Prompt {}`

PSReadLine is not required. The native `Prompt` function is the universal mechanism across Windows PowerShell and PowerShell Core. Right-prompt is supported via PSReadLine's `ContinuationPrompt` but that's a separate zone and out of scope for now — right-prompt for PowerShell uses cursor-positioning (same as Bash approach).

### 4. Color variables named by theme slot

`_TT_VCS`, `_TT_PATH`, `_TT_ERROR` — not by block id. This matches the design system vocabulary, makes the generated code scannable, and avoids duplication when multiple blocks share a slot.

### 5. Zone costs alongside block costs on ExportTarget

```ts
interface ExportTarget {
  id: ExportTargetId;
  name: string;
  surfaceId: string;
  blockCosts: Record<string, number>;  // blockId → cost
  zoneCosts: Record<string, number>;   // zoneId → cost
}
```

Zone-level limitations (right-prompt in Bash) are structurally different from block-level limitations. Keeping them separate lets the UI surface zone warnings distinctly from block warnings.

### 6. Two code sections per target

Every target produces exactly two named sections: **Colors** and **Prompt**. The UI renders them as labeled blocks with individual Copy buttons plus a top-level Copy All. "Colors" is always first — users with existing color setups can skip it.

### 7. Powerline/powertab: emit Nerd Font comment, otherwise just work

Powerline glyph generation (`\ue0b0` etc.) is straightforward ANSI. We don't gate it — we emit a comment at the top of the generated block. Users are assumed to know what they're opting into.

## Risks / Trade-offs

- **Right-prompt Bash fragility**: cursor-positioning breaks on terminal resize mid-line. Cost=75 signals this. A future improvement could add a zsh-specific `$RPROMPT` path.
- **PROMPT_COMMAND conflicts**: users may already use `PROMPT_COMMAND` for other things (e.g. `__vte_prompt_command`). We append to `PROMPT_COMMAND` as an array element rather than overwriting: `PROMPT_COMMAND+=(_tt_build_prompt)`.
- **Truecolor assumption**: terminals without truecolor support will show garbage colors. This is the right default for 2025+ but worth a future "compatibility mode" note.
