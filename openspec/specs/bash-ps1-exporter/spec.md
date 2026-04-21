## ADDED Requirements

### Requirement: Bash exporter produces two named code sections
The Bash exporter SHALL return an array of `CodeSection` objects, each with a `label` and `code` string. The sections SHALL always be in order: `["Colors", "Prompt"]`.

#### Scenario: Standard export with blocks in left-prompt
- **WHEN** the exporter runs against a config with blocks in left-prompt
- **THEN** it returns exactly two sections: Colors and Prompt

### Requirement: Colors section declares truecolor ANSI variables per theme slot
The Colors section SHALL declare one shell variable per distinct theme slot used by active blocks. Variable names SHALL use the pattern `_TT_<SLOT>` in uppercase (e.g. `_TT_VCS`, `_TT_PATH`). A `_TT_RESET` variable SHALL always be included. Colors SHALL use truecolor ANSI format: `\[\e[38;2;R;G;Bm\]` for foreground.

#### Scenario: Theme slot deduplication
- **WHEN** two blocks share the same theme slot
- **THEN** only one variable is declared for that slot

#### Scenario: Reset variable always present
- **WHEN** any blocks are active
- **THEN** `_TT_RESET='\[\e[0m\]'` appears in the Colors section

#### Scenario: Background color for powerline blocks
- **WHEN** a block is rendered with powerline layout
- **THEN** background ANSI code `\[\e[48;2;R;G;Bm\]` is included in the layout output

### Requirement: Prompt section uses PROMPT_COMMAND with a builder function
The Prompt section SHALL declare `_tt_build_prompt()` and append it to `PROMPT_COMMAND` using array syntax: `PROMPT_COMMAND+=(_tt_build_prompt)`. The function SHALL build the `PS1` variable by concatenating zone output strings.

#### Scenario: PROMPT_COMMAND append pattern
- **WHEN** the Prompt section is generated
- **THEN** it ends with `PROMPT_COMMAND+=(_tt_build_prompt)` not `PROMPT_COMMAND=_tt_build_prompt`

### Requirement: Conditional blocks use subshell checks inside the builder
Blocks whose visibility depends on runtime data (git branch, exit code, env versions) SHALL be wrapped in conditional logic inside `_tt_build_prompt`. Static blocks (user, host, cwd) SHALL be appended unconditionally.

#### Scenario: Git branch block conditional
- **WHEN** the config contains the git-branch block
- **THEN** the generated code checks `git branch --show-current 2>/dev/null` and only appends if non-empty

#### Scenario: Static block unconditional
- **WHEN** the config contains the cwd block
- **THEN** the generated code appends `\w` without a conditional guard

### Requirement: Powerline and powertab layouts emit a Nerd Font comment
When any zone uses powerline or powertab layout, the Prompt section SHALL include a comment `# Requires Nerd Font` at the top of `_tt_build_prompt`.

#### Scenario: Nerd Font comment presence
- **WHEN** the left-prompt zone uses powerline layout
- **THEN** the first line of the function body is `# Requires Nerd Font`

### Requirement: Right-prompt uses cursor-positioning approach
When the right-prompt zone is enabled and non-empty, the Prompt section SHALL include code that positions the cursor to the right side of the terminal using `tput cols` and `\r`.

#### Scenario: Right-prompt included in builder
- **WHEN** right-prompt zone is enabled and has blocks
- **THEN** `_tt_build_prompt` includes a `printf "%*s\r"` call for the right-prompt content

### Requirement: Prompt character from global options
The `prompt-char` global option SHALL appear as the terminal prompt character at the end of `PS1`. The `multiline` global option SHALL cause PS1 to be split across two lines with a newline before the prompt character.

#### Scenario: Custom prompt character
- **WHEN** prompt-char is set to "λ"
- **THEN** the generated PS1 ends with ` λ ` (space-char-space)

#### Scenario: Multiline prompt
- **WHEN** multiline is true
- **THEN** PS1 contains `\n` before the prompt character line

### Requirement: Auto-contrast matches the preview's WCAG formula
When the Bash exporter emits a foreground color chosen by auto-contrast against a background (used for powerline/powertab icon regions), it SHALL use the same WCAG 2.x relative-luminance contrast ratio that `src/lib/renderer.ts` uses for the browser preview. The exporter SHALL NOT ship its own divergent formula.

#### Scenario: Exported auto-contrast agrees with preview at a mid-luminance slot
- **WHEN** a packaged theme has a slot whose background hex sits near the WCAG crossover (e.g. a mid-grey `vcs` color)
- **THEN** the color the preview picks for that slot's icon foreground equals the color the Bash exporter writes to `_TT_<SLOT>_FG`

#### Scenario: Single canonical implementation
- **WHEN** the Bash exporter decides between black and white for an auto-contrast foreground
- **THEN** it invokes the shared `autoContrast` utility in `src/lib/color.ts` rather than a local copy
