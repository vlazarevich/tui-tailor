## ADDED Requirements

### Requirement: PowerShell exporter produces two named code sections
The PowerShell exporter SHALL return an array of `CodeSection` objects with labels `["Colors", "Prompt"]`, in that order.

#### Scenario: Standard export with blocks in left-prompt
- **WHEN** the exporter runs against a config with blocks in left-prompt
- **THEN** it returns exactly two sections: Colors and Prompt

### Requirement: Colors section declares truecolor escape variables per theme slot
The Colors section SHALL declare one PowerShell variable per distinct theme slot used by active blocks. Variable names SHALL use the pattern `$TtColor<Slot>` in PascalCase (e.g. `$TtColorVcs`, `$TtColorPath`). A `$TtReset` variable SHALL always be included. Colors SHALL use PowerShell truecolor escape format: `[char]27 + '[38;2;R;G;Bm'`.

#### Scenario: Reset variable always present
- **WHEN** any blocks are active
- **THEN** `$TtReset = [char]27 + '[0m'` appears in the Colors section

#### Scenario: Theme slot deduplication
- **WHEN** two blocks share the same theme slot
- **THEN** only one variable is declared for that slot

### Requirement: Prompt section defines a Prompt function
The Prompt section SHALL declare `function Prompt { }`. The function SHALL build a prompt string and return it. It SHALL reference the color variables declared in the Colors section.

#### Scenario: Prompt function structure
- **WHEN** any blocks are active
- **THEN** the section contains `function Prompt {` and returns a string ending with the prompt character

### Requirement: Conditional blocks use inline checks inside Prompt function
Blocks whose visibility depends on runtime data SHALL be wrapped in `if` checks inside the function. Static blocks SHALL be appended unconditionally.

#### Scenario: Git branch block conditional
- **WHEN** the config contains git-branch
- **THEN** generated code runs `git branch --show-current 2>$null` and appends only if non-empty

### Requirement: Powerline and powertab layouts emit a Nerd Font comment
When any zone uses powerline or powertab layout, the Prompt section SHALL include a comment `# Requires Nerd Font` at the top of the function body.

#### Scenario: Nerd Font comment presence
- **WHEN** left-prompt zone uses powerline layout
- **THEN** the first line inside `function Prompt {` is `# Requires Nerd Font`

### Requirement: Prompt character from global options
The `prompt-char` global option SHALL appear at the end of the returned prompt string. The `multiline` global option SHALL cause a newline before the prompt character.

#### Scenario: Custom prompt character
- **WHEN** prompt-char is set to "λ"
- **THEN** the returned string ends with ` λ `

#### Scenario: Multiline prompt
- **WHEN** multiline is true
- **THEN** the returned string contains `` `n `` before the prompt character

### Requirement: Installation target is $PROFILE
The generated output SHALL include a comment indicating it should be added to `$PROFILE`. The Colors section comment SHALL read `# Add to $PROFILE`.

#### Scenario: Profile comment present
- **WHEN** PowerShell export is generated
- **THEN** the Colors section begins with `# Add to $PROFILE`

### Requirement: PowerShell exporter emits code by walking block captures
The PowerShell exporter SHALL produce its output by iterating block captures and formatting their `powershell-prompt` bindings. The exporter MUST NOT contain a per-block `switch` or a family of `generate<BlockId>Block` functions.

#### Scenario: Adding a new block requires no exporter change
- **WHEN** a new block is added with captures that declare `powershell-prompt` bindings
- **THEN** the PowerShell exporter emits correct code without edits to `src/lib/exporters/powershell.ts`

#### Scenario: Output for existing configs is equivalent
- **WHEN** a snapshot config is exported
- **THEN** the generated PowerShell produces the same runtime prompt as the pre-refactor PowerShell for the same scenario

### Requirement: PowerShell exporter consumes the shared zone IR
The PowerShell exporter SHALL obtain zone layout via the shared `compose/arrange` module and SHALL NOT carry its own copies of layout logic.

#### Scenario: Powerline/powertab zones render through unified pipeline
- **WHEN** a config uses powerline or powertab layout and is exported to PowerShell
- **THEN** the generated output renders every block the preview renders, using spans produced by `compose/arrange`
