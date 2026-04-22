## ADDED Requirements

### Requirement: Export opens as a full-screen popup overlay
The export UI SHALL be presented as a popup overlay triggered by an "Export" button in the ExportPanel sidebar section. The popup SHALL cover the full viewport with a backdrop. It SHALL be dismissible via a close button or by pressing Escape. The popup SHALL be wide enough to display code comfortably (min ~80ch).

#### Scenario: Opening the export popup
- **WHEN** user clicks the Export button in the sidebar
- **THEN** a full-screen overlay appears with the export UI

#### Scenario: Closing via Escape
- **WHEN** the popup is open and user presses Escape
- **THEN** the popup closes

#### Scenario: Closing via close button
- **WHEN** user clicks the close button in the popup
- **THEN** the popup closes

### Requirement: Export panel shows tabs for available targets
The export popup SHALL render one tab per export target compatible with the active surface. The active tab SHALL be visually distinct.

#### Scenario: Terminal prompt shows Bash and PowerShell tabs
- **WHEN** the active surface is terminal-prompt
- **THEN** tabs for "Bash" and "PowerShell" are visible
- **THEN** the first tab (Bash) is selected by default

#### Scenario: Switching tabs updates displayed code
- **WHEN** user clicks the PowerShell tab
- **THEN** the code sections update to show PowerShell output

### Requirement: Export panel renders code sections with labels and Copy buttons
Each `CodeSection` returned by the exporter SHALL be rendered as a labeled block with the section label, a read-only code area, and a per-section Copy button.

#### Scenario: Colors and Prompt sections visible
- **WHEN** Bash tab is active and config has blocks
- **THEN** two labeled sections appear: "Colors" and "Prompt"

#### Scenario: Per-section copy
- **WHEN** user clicks Copy on the Colors section
- **THEN** only the Colors section code is written to clipboard

### Requirement: Export panel provides a Copy All action
A "Copy All" button SHALL be present that writes all sections concatenated (with a blank line between) to the clipboard.

#### Scenario: Copy All combines sections
- **WHEN** user clicks "Copy All"
- **THEN** clipboard contains Colors code + blank line + Prompt code

### Requirement: Copy buttons show confirmation feedback
After a successful clipboard write, the clicked Copy button SHALL display "Copied!" for 2 seconds then revert to its original label.

#### Scenario: Copy confirmation
- **WHEN** user clicks Copy or Copy All
- **THEN** the button label changes to "Copied!" for 2 seconds

### Requirement: Installation hint shown per target
Below the target tabs, a one-line hint SHALL indicate where to add the generated code. For Bash: `# Add to ~/.bashrc`. For PowerShell: `# Add to $PROFILE`.

#### Scenario: Bash installation hint
- **WHEN** Bash tab is active
- **THEN** hint text reads "Add to ~/.bashrc"

#### Scenario: PowerShell installation hint
- **WHEN** PowerShell tab is active
- **THEN** hint text reads "Add to $PROFILE"

### Requirement: Zone cost warnings are shown when a zone has cost > 0
If the active target has a non-zero zone cost for an enabled zone, the export panel SHALL show a warning adjacent to the relevant section.

#### Scenario: Bash right-prompt warning
- **WHEN** Bash tab is active and right-prompt zone is enabled
- **THEN** a warning is displayed: "Right prompt uses cursor positioning — may be unreliable on terminal resize"

#### Scenario: No warning when zone cost is 0
- **WHEN** PowerShell tab is active and right-prompt zone is enabled
- **THEN** no zone-level warning is shown

### Requirement: Export panel surfaces per-block missing-binding warnings
When an exporter reports warnings about blocks missing a target binding, the `ExportPopup` component SHALL display each warning as a distinct line identifying the block by display name and stating the reason (e.g. "git-status: no bash-ps1 binding for capture 'unstaged'").

#### Scenario: Warning visible for a block dropped due to missing binding
- **WHEN** the active export target has no binding for a capture used by a block in the current config
- **THEN** the export popup renders a warning line that names the block and the missing binding

#### Scenario: No false positives
- **WHEN** every block in the current config has full bindings for the active target
- **THEN** no missing-binding warnings are rendered
