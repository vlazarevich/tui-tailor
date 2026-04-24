import type { BlockDefinition, CaptureDefinition, ScenarioData } from "../types";

// Shorthand for building target bindings.
const bashCap = (setup: string[], ref: string, guard: string) => ({ setup, ref, guard });
const psCap = (setup: string[], ref: string, guard: string) => ({ setup, ref, guard });

// Build capture with both target bindings in one call.
function cap(
  scenario: CaptureDefinition["scenario"],
  bash: { setup: string[]; ref: string; guard: string },
  pwsh: { setup: string[]; ref: string; guard: string },
  opts: { optional?: boolean } = {},
): CaptureDefinition {
  return { scenario, optional: opts.optional, targets: { "bash-ps1": bash, "powershell-prompt": pwsh } };
}

// Always-truthy guard (capture is required by its mere presence — no runtime check).
const BASH_ALWAYS = "true";
const PS_ALWAYS = "$true";

// Empty capture — value always resolves to "" in scenario and shell. Useful for
// placeholder elements in extended/max language presets that will be wired later.
function emptyCap(): CaptureDefinition {
  return cap(
    () => "",
    bashCap([], "", `false`),
    psCap([], "", `$false`),
    { optional: true },
  );
}

const blocks: BlockDefinition[] = [
  // ─── Essential: session ─────────────────────────────────────────────────────
  {
    id: "session",
    name: "Session",
    category: "essential",
    surfaces: ["terminal-prompt"],
    captures: {
      user: cap(
        (d) => d.user ?? "",
        bashCap([], "\\u", BASH_ALWAYS),
        psCap([], "$env:USERNAME", PS_ALWAYS),
      ),
      host: cap(
        (d) => d.host ?? "",
        bashCap([], "\\h", BASH_ALWAYS),
        psCap([], "$env:COMPUTERNAME", PS_ALWAYS),
      ),
      shell: cap(
        (d) => d.shell ?? "",
        bashCap([`local _shell; _shell=$(basename "${'${SHELL:-sh}'}")`], "$_shell", `[[ -n "$_shell" ]]`),
        psCap([`$_shell = "pwsh"`], "$_shell", `$_shell`),
        { optional: true },
      ),
      os: cap(
        (d) => d.os ?? "",
        bashCap(
          [`local _os; _os=$(. /etc/os-release 2>/dev/null; echo "$ID")`],
          "$_os",
          `[[ -n "$_os" ]]`,
        ),
        psCap(
          [`$_os = if ($IsWindows) { "windows" } elseif ($IsMacOS) { "macos" } elseif ($IsLinux) { "linux" } else { "" }`],
          "$_os",
          `$_os`,
        ),
        { optional: true },
      ),
      userAtHost: cap(
        (d) => {
          const u = d.user ?? "";
          const h = d.host ?? "";
          if (u && h) return `${u}@${h}`;
          return u || h || "";
        },
        bashCap(
          [
            `local _uh_u="${'${USER:-$(whoami 2>/dev/null)}'}"`,
            `local _uh_h="${'${HOSTNAME:-$(hostname 2>/dev/null)}'}"`,
            `local _userhost=""`,
            `if [[ -n "$_uh_u" && -n "$_uh_h" ]]; then _userhost="${'${_uh_u}'}@${'${_uh_h}'}"`,
            `elif [[ -n "$_uh_u" ]]; then _userhost="$_uh_u"`,
            `elif [[ -n "$_uh_h" ]]; then _userhost="$_uh_h"`,
            `fi`,
          ],
          "$_userhost",
          `[[ -n "$_userhost" ]]`,
        ),
        psCap(
          [
            `$_uh_u = $env:USERNAME`,
            `$_uh_h = $env:COMPUTERNAME`,
            `$_userhost = if ($_uh_u -and $_uh_h) { "$_uh_u@$_uh_h" } elseif ($_uh_u) { $_uh_u } elseif ($_uh_h) { $_uh_h } else { "" }`,
          ],
          "$_userhost",
          `$_userhost`,
        ),
      ),
    },
    elements: {
      user: { capture: "user", role: "content", themeSlot: "user" },
      host: { capture: "host", role: "content", themeSlot: "host" },
      shell: { capture: "shell", role: "content" },
      os: { capture: "os", role: "content" },
      osIcon: { value: "", role: "icon" },
      userAtHost: { capture: "userAtHost", role: "content" },
      shellConnector: { value: "on", role: "connector" },
    },
    styles: {
      "user-only": "{user}",
      "host-only": "{host}",
      "shell-only": "{shell}",
      "os-only": "{osIcon} {os}",
      "user@host": "{userAtHost}",
      "shell+os": "{shell} {shellConnector} {osIcon} {os}",
      all: "{userAtHost} {osIcon} {os} {shell}",
    },
    themeSlot: "user",
    defaultStyle: "user@host",
    exportCosts: { "bash-ps1": 0, "powershell-prompt": 0 },
  },

  // ─── Essential: cwd ─────────────────────────────────────────────────────────
  {
    id: "cwd",
    name: "Directory",
    category: "essential",
    surfaces: ["terminal-prompt"],
    captures: {
      dir: cap(
        (d) => d.cwd ?? "",
        bashCap([], "\\w", BASH_ALWAYS),
        psCap([], "$(Get-Location)", PS_ALWAYS),
      ),
    },
    elements: {
      dir: { capture: "dir", role: "content" },
      icon: { value: "", role: "icon" },
      connector: { value: "in", role: "connector" },
    },
    styles: {
      absolute: "{icon} {dir}",
      tilde: "{icon} {dir}",
      "short-3": "{icon} {dir}",
      "short-5": "{icon} {dir}",
    },
    themeSlot: "path",
    defaultStyle: "tilde",
    exportCosts: { "bash-ps1": 0, "powershell-prompt": 0 },
  },

  // ─── VCS: git ───────────────────────────────────────────────────────────────
  {
    id: "git",
    name: "Git",
    category: "vcs",
    surfaces: ["terminal-prompt"],
    captures: {
      branch: cap(
        (d) => d.branch ?? "",
        bashCap([`local _branch; _branch=$(git branch --show-current 2>/dev/null)`], "$_branch", `[[ -n "$_branch" ]]`),
        psCap([`$_branch = git branch --show-current 2>$null`], "$_branch", "$_branch"),
      ),
      ahead: cap(
        (d) => (d.ahead && d.ahead > 0 ? `↑${d.ahead}` : ""),
        bashCap(
          [
            `local _gitb; _gitb=$(git rev-list --count --left-right @{upstream}...HEAD 2>/dev/null || echo "0\t0")`,
            `local _ahead_n; _ahead_n=$(echo "$_gitb" | cut -f2)`,
          ],
          "↑$_ahead_n",
          `[ "$_ahead_n" -gt 0 ] 2>/dev/null`,
        ),
        psCap(
          [
            `$_gitCounts = git rev-list --count --left-right "@{upstream}...HEAD" 2>$null`,
            `$_aheadN = if ($_gitCounts) { ($_gitCounts -split "\`t")[1] } else { "0" }`,
          ],
          "↑$_aheadN",
          "[int]$_aheadN -gt 0",
        ),
        { optional: true },
      ),
      behind: cap(
        (d) => (d.behind && d.behind > 0 ? `↓${d.behind}` : ""),
        bashCap(
          [
            `local _gitb; _gitb=$(git rev-list --count --left-right @{upstream}...HEAD 2>/dev/null || echo "0\t0")`,
            `local _behind_n; _behind_n=$(echo "$_gitb" | cut -f1)`,
          ],
          "↓$_behind_n",
          `[ "$_behind_n" -gt 0 ] 2>/dev/null`,
        ),
        psCap(
          [
            `$_gitCounts = git rev-list --count --left-right "@{upstream}...HEAD" 2>$null`,
            `$_behindN = if ($_gitCounts) { ($_gitCounts -split "\`t")[0] } else { "0" }`,
          ],
          "↓$_behindN",
          "[int]$_behindN -gt 0",
        ),
        { optional: true },
      ),
      dirty: cap(
        (d) => (d.dirty ? "*" : ""),
        bashCap([`local _dirty; _dirty=$(git status --porcelain 2>/dev/null | head -1)`], "*", `[ -n "$_dirty" ]`),
        psCap([`$_dirty = git status --porcelain 2>$null | Select-Object -First 1`], "*", "$_dirty"),
        { optional: true },
      ),
      staged: cap(
        (d) => (d.staged && d.staged > 0 ? `+${d.staged}` : ""),
        bashCap(
          [`local _staged; _staged=$(git diff --cached --name-only 2>/dev/null | wc -l | tr -d ' ')`],
          "+$_staged",
          `[ "$_staged" -gt 0 ]`,
        ),
        psCap(
          [`$_staged = (git diff --cached --name-only 2>$null | Measure-Object -Line).Lines`],
          "+$_staged",
          "$_staged -gt 0",
        ),
        { optional: true },
      ),
      unstaged: cap(
        (d) => (d.unstaged && d.unstaged > 0 ? `~${d.unstaged}` : ""),
        bashCap(
          [`local _unstaged; _unstaged=$(git diff --name-only 2>/dev/null | wc -l | tr -d ' ')`],
          "~$_unstaged",
          `[ "$_unstaged" -gt 0 ]`,
        ),
        psCap(
          [`$_unstaged = (git diff --name-only 2>$null | Measure-Object -Line).Lines`],
          "~$_unstaged",
          "$_unstaged -gt 0",
        ),
        { optional: true },
      ),
      deleted: cap(
        (d) => (d.deleted && d.deleted > 0 ? `-${d.deleted}` : ""),
        bashCap(
          [`local _deleted; _deleted=$(git ls-files --deleted 2>/dev/null | wc -l | tr -d ' ')`],
          "-$_deleted",
          `[ "$_deleted" -gt 0 ]`,
        ),
        psCap(
          [`$_deleted = (git ls-files --deleted 2>$null | Measure-Object -Line).Lines`],
          "-$_deleted",
          "$_deleted -gt 0",
        ),
        { optional: true },
      ),
      renamed: cap(
        (d) => (d.renamed && d.renamed > 0 ? `»${d.renamed}` : ""),
        bashCap(
          [`local _renamed; _renamed=$(git diff --name-only --diff-filter=R 2>/dev/null | wc -l | tr -d ' ')`],
          "»$_renamed",
          `[ "$_renamed" -gt 0 ]`,
        ),
        psCap(
          [`$_renamed = (git diff --name-only --diff-filter=R 2>$null | Measure-Object -Line).Lines`],
          "»$_renamed",
          "$_renamed -gt 0",
        ),
        { optional: true },
      ),
      untracked: cap(
        (d) => (d.untracked && d.untracked > 0 ? `?${d.untracked}` : ""),
        bashCap(
          [`local _untracked; _untracked=$(git ls-files --others --exclude-standard 2>/dev/null | wc -l | tr -d ' ')`],
          "?$_untracked",
          `[ "$_untracked" -gt 0 ]`,
        ),
        psCap(
          [`$_untracked = (git ls-files --others --exclude-standard 2>$null | Measure-Object -Line).Lines`],
          "?$_untracked",
          "$_untracked -gt 0",
        ),
        { optional: true },
      ),
      churn: cap(
        (d) => {
          const a = d.linesAdded ?? 0;
          const r = d.linesRemoved ?? 0;
          if (a === 0 && r === 0) return "";
          return `+${a}/-${r}`;
        },
        bashCap(
          [
            `local _churn_a _churn_r _churn`,
            `_churn_a=$(git diff --numstat 2>/dev/null | awk '{a+=$1} END {print a+0}')`,
            `_churn_r=$(git diff --numstat 2>/dev/null | awk '{r+=$2} END {print r+0}')`,
            `_churn="+${'${_churn_a}'}/-${'${_churn_r}'}"`,
          ],
          "$_churn",
          `[ "$_churn_a" -gt 0 ] || [ "$_churn_r" -gt 0 ]`,
        ),
        psCap(
          [
            `$_churnA = (git diff --numstat 2>$null | ForEach-Object { ($_ -split "\`t")[0] } | Measure-Object -Sum).Sum`,
            `$_churnR = (git diff --numstat 2>$null | ForEach-Object { ($_ -split "\`t")[1] } | Measure-Object -Sum).Sum`,
            `$_churn = "+$_churnA/-$_churnR"`,
          ],
          "$_churn",
          "($_churnA -gt 0) -or ($_churnR -gt 0)",
        ),
        { optional: true },
      ),
    },
    elements: {
      branch: { capture: "branch", role: "content" },
      icon: { value: "", role: "icon" },
      ahead: { capture: "ahead", role: "content", themeSlot: "vcs-ahead" },
      behind: { capture: "behind", role: "content", themeSlot: "vcs-behind" },
      dirty: { capture: "dirty", role: "content", themeSlot: "vcs-dirty" },
      staged: { capture: "staged", role: "content" },
      unstaged: { capture: "unstaged", role: "content" },
      deleted: { capture: "deleted", role: "content" },
      renamed: { capture: "renamed", role: "content" },
      untracked: { capture: "untracked", role: "content" },
      churn: { capture: "churn", role: "content" },
      connector: { value: "on", role: "connector" },
    },
    styles: {
      minimal: "{icon} {branch} {dirty}",
      medium: "{icon} {branch} {ahead}{behind} {dirty}",
      full: "{icon} {branch} {ahead}{behind} {staged}{unstaged}{deleted}{renamed}{untracked}",
      max: "{icon} {branch} {ahead}{behind} {staged}{unstaged}{deleted}{renamed}{untracked} {churn}",
    },
    themeSlot: "vcs",
    defaultStyle: "minimal",
    exportCosts: { "bash-ps1": 0, "powershell-prompt": 0 },
  },

  // ─── Status: last-command ───────────────────────────────────────────────────
  {
    id: "last-command",
    name: "Last Command",
    category: "status",
    surfaces: ["terminal-prompt"],
    captures: {
      errorIcon: cap(
        (d) => (d.exitCode && d.exitCode !== 0 ? "✗" : ""),
        bashCap([], "✗", `[[ $_last_exit -ne 0 ]]`),
        psCap([], "✗", "$exitCode -ne 0"),
        { optional: true },
      ),
      code: cap(
        (d) => (d.exitCode && d.exitCode !== 0 ? String(d.exitCode) : ""),
        bashCap([], "$_last_exit", `[[ $_last_exit -ne 0 ]]`),
        psCap([], "$exitCode", "$exitCode -ne 0"),
        { optional: true },
      ),
      duration: cap(
        (d) => d.cmdDuration ?? "",
        bashCap(
          [
            `local _dur=""`,
            `if [[ $_cmd_ms -ge 1000 ]]; then _dur=$(( _cmd_ms / 1000 ))s; fi`,
            `if [[ $_cmd_ms -ge 60000 ]]; then _dur="$(( _cmd_ms / 60000 ))m$(( (_cmd_ms % 60000) / 1000 ))s"; fi`,
          ],
          "$_dur",
          `[[ $_cmd_ms -ge 1000 ]]`,
        ),
        psCap(
          [
            `$_dur = if ($_elapsed -ge 60000) { "$([int]($_elapsed/60000))m$([int](($_elapsed%60000)/1000))s" } else { "$([int]($_elapsed/1000))s" }`,
          ],
          "$_dur",
          "$_elapsed -ge 1000",
        ),
        { optional: true },
      ),
      sep: cap(
        (d) => ((d.exitCode && d.exitCode !== 0 && d.cmdDuration) ? "·" : ""),
        bashCap([], "·", `[[ $_last_exit -ne 0 && $_cmd_ms -ge 1000 ]]`),
        psCap([], "·", "($exitCode -ne 0) -and ($_elapsed -ge 1000)"),
        { optional: true },
      ),
    },
    elements: {
      errorIcon: { capture: "errorIcon", role: "content", themeSlot: "error" },
      code: { capture: "code", role: "content" },
      duration: { capture: "duration", role: "content" },
      sep: { capture: "sep", role: "content" },
    },
    styles: {
      "icon-only": "{errorIcon}",
      "exitcode-only": "{code}",
      "duration-only": "{duration}",
      "code+duration": "{errorIcon} {code} {sep} {duration}",
    },
    themeSlot: "error",
    defaultStyle: "code+duration",
    exportCosts: { "bash-ps1": 0, "powershell-prompt": 0 },
    targetHooks: {
      "bash-ps1": {
        preExec: [
          `_TT_CMD_START=$(date +%s%3N)`,
          `trap '_TT_CMD_START=$(date +%s%3N)' DEBUG`,
        ],
        promptLocal: [
          `local _last_exit=$?`,
          `local _cmd_end; _cmd_end=$(date +%s%3N)`,
          `local _cmd_ms=$(( _cmd_end - _TT_CMD_START ))`,
        ],
      },
      "powershell-prompt": {
        preExec: [`$global:TtCmdStart = Get-Date`],
        promptLocal: [
          `$exitCode = $LASTEXITCODE`,
          `$_elapsed = [int]((Get-Date) - $global:TtCmdStart).TotalMilliseconds`,
          `$global:TtCmdStart = Get-Date`,
        ],
      },
    },
  },

  // ─── Status: sudo ───────────────────────────────────────────────────────────
  {
    id: "sudo",
    name: "Elevation",
    category: "status",
    surfaces: ["terminal-prompt"],
    captures: {
      iconGlyph: cap(
        (d) => (d.isSudo ? "" : ""),
        bashCap(
          [`local _sudo=""; if [[ $EUID -eq 0 ]] || sudo -n true 2>/dev/null; then _sudo=1; fi`],
          "",
          `[[ -n "$_sudo" ]]`,
        ),
        psCap(
          [
            `$_sudo = $false`,
            `try { $_sudo = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator) } catch {}`,
          ],
          "",
          "$_sudo",
        ),
        { optional: true },
      ),
      label: cap(
        (d) => (d.isSudo ? "sudo" : ""),
        bashCap(
          [`local _sudo=""; if [[ $EUID -eq 0 ]] || sudo -n true 2>/dev/null; then _sudo=1; fi`],
          "sudo",
          `[[ -n "$_sudo" ]]`,
        ),
        psCap(
          [
            `$_sudo = $false`,
            `try { $_sudo = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator) } catch {}`,
          ],
          "sudo",
          "$_sudo",
        ),
        { optional: true },
      ),
    },
    elements: {
      iconGlyph: { capture: "iconGlyph", role: "content" },
      label: { capture: "label", role: "content" },
    },
    styles: {
      icon: "{iconGlyph}",
      text: "{label}",
    },
    themeSlot: "warning",
    defaultStyle: "icon",
    exportCosts: { "bash-ps1": 0, "powershell-prompt": 0 },
  },

  // ─── Status: jobs ───────────────────────────────────────────────────────────
  {
    id: "jobs",
    name: "Background Jobs",
    category: "status",
    surfaces: ["terminal-prompt"],
    captures: {
      count: cap(
        (d) => (d.jobCount && d.jobCount > 0 ? String(d.jobCount) : ""),
        bashCap([], "\\j", `[[ \\j -gt 0 ]]`),
        psCap(
          [`$_jobCount = @(Get-Job | Where-Object { $_.State -eq 'Running' }).Count`],
          "$_jobCount",
          "$_jobCount -gt 0",
        ),
      ),
    },
    elements: {
      count: { capture: "count", role: "content" },
      icon: { value: "✦", role: "icon" },
      label: { value: "jobs", role: "connector" },
    },
    styles: {
      minimal: "{icon} {count}",
      extended: "{icon} {count} {label}",
    },
    themeSlot: "info",
    defaultStyle: "minimal",
    exportCosts: { "bash-ps1": 0, "powershell-prompt": 0 },
  },

  // ─── Status: clock ──────────────────────────────────────────────────────────
  {
    id: "clock",
    name: "Clock",
    category: "status",
    surfaces: ["terminal-prompt"],
    captures: {
      time: cap(
        (d) => d.time ?? "",
        bashCap([], "\\t", BASH_ALWAYS),
        psCap([], "$(Get-Date -Format 'HH:mm:ss')", PS_ALWAYS),
      ),
      battery: cap(
        (d) => d.battery ?? "",
        bashCap(
          [
            `local _batt=""`,
            `if [[ -r /sys/class/power_supply/BAT0/capacity ]]; then _batt="$(cat /sys/class/power_supply/BAT0/capacity)%"; fi`,
          ],
          "$_batt",
          `[[ -n "$_batt" ]]`,
        ),
        psCap(
          [
            `$_batt = ""`,
            `try { $_b = (Get-CimInstance Win32_Battery -ErrorAction Stop).EstimatedChargeRemaining; if ($_b) { $_batt = "$_b%" } } catch {}`,
          ],
          "$_batt",
          "$_batt",
        ),
        { optional: true },
      ),
    },
    elements: {
      time: { capture: "time", role: "content" },
      battery: { capture: "battery", role: "content" },
      batteryIcon: { value: "", role: "icon" },
      sep: { value: "·", role: "connector" },
    },
    styles: {
      "time-only": "{time}",
      "battery-icon": "{batteryIcon}",
      "battery-pct": "{batteryIcon} {battery}",
      full: "{time} {sep} {batteryIcon} {battery}",
    },
    themeSlot: "info",
    defaultStyle: "time-only",
    exportCosts: { "bash-ps1": 0, "powershell-prompt": 0 },
  },

  // ─── Status: sysinfo ────────────────────────────────────────────────────────
  {
    id: "sysinfo",
    name: "System Info",
    category: "status",
    surfaces: ["terminal-prompt"],
    captures: {
      mem: cap(
        (d) => d.memUsage ?? "",
        bashCap(
          [`local _mem; _mem=$(free 2>/dev/null | awk '/^Mem:/ {printf "%d%%", $3*100/$2}')`],
          "$_mem",
          `[[ -n "$_mem" ]]`,
        ),
        psCap(
          [
            `$_mem = ""`,
            `try { $_os = Get-CimInstance Win32_OperatingSystem -ErrorAction Stop; $_mem = "$([int](100 - ($_os.FreePhysicalMemory / $_os.TotalVisibleMemorySize * 100)))%" } catch {}`,
          ],
          "$_mem",
          "$_mem",
        ),
      ),
      disk: cap(
        (d) => d.diskUsage ?? "",
        bashCap(
          [`local _disk; _disk=$(df -h / 2>/dev/null | awk 'NR==2 {print $5}')`],
          "$_disk",
          `[[ -n "$_disk" ]]`,
        ),
        psCap(
          [
            `$_disk = ""`,
            `try { $_d = Get-PSDrive C -ErrorAction Stop; $_disk = "$([int](($_d.Used / ($_d.Used + $_d.Free)) * 100))%" } catch {}`,
          ],
          "$_disk",
          "$_disk",
        ),
        { optional: true },
      ),
    },
    elements: {
      memIcon: { value: "󰍛", role: "icon" },
      mem: { capture: "mem", role: "content" },
      diskIcon: { value: "󰋊", role: "icon" },
      disk: { capture: "disk", role: "content" },
      sep: { value: "·", role: "connector" },
    },
    styles: {
      "mem-only": "{memIcon} {mem}",
      "mem+disk": "{memIcon} {mem} {sep} {diskIcon} {disk}",
      full: "{memIcon} {mem} {sep} {diskIcon} {disk}",
    },
    themeSlot: "info",
    defaultStyle: "mem-only",
    exportCosts: { "bash-ps1": 0, "powershell-prompt": 0 },
  },

  // ─── Language blocks ───────────────────────────────────────────────────────
  ...makeLanguageBlock("node", "Node.js", "", "nodeVersion", "nodeTargetVersion", {
    bashCmd: `$(node --version 2>/dev/null | sed 's/v//')`,
    psCmd: `(node --version 2>$null) -replace '^v',''`,
    bashTargetCmd: `$(cat .nvmrc 2>/dev/null | sed 's/v//')`,
    psTargetCmd: `(Get-Content .nvmrc -ErrorAction SilentlyContinue) -replace '^v',''`,
  }),
  ...makeLanguageBlock("python", "Python", "", "pythonVersion", "pythonTargetVersion", {
    bashCmd: `$(python3 --version 2>/dev/null | awk '{print $2}')`,
    psCmd: `(python3 --version 2>$null) -replace 'Python ',''`,
    bashTargetCmd: `$(cat .python-version 2>/dev/null)`,
    psTargetCmd: `Get-Content .python-version -ErrorAction SilentlyContinue`,
  }),
  ...makeLanguageBlock("ruby", "Ruby", "", "rubyVersion", "rubyTargetVersion", {
    bashCmd: `$(ruby --version 2>/dev/null | awk '{print $2}')`,
    psCmd: `(ruby --version 2>$null) -split ' ' | Select -Index 1`,
    bashTargetCmd: `$(cat .ruby-version 2>/dev/null)`,
    psTargetCmd: `Get-Content .ruby-version -ErrorAction SilentlyContinue`,
  }),
  ...makeLanguageBlock("go", "Go", "", "golangVersion", "golangTargetVersion", {
    bashCmd: `$(go version 2>/dev/null | awk '{print $3}' | sed 's/go//')`,
    psCmd: `(go version 2>$null) -replace '.*go([\\d.]+).*','$1'`,
    bashTargetCmd: `$(awk '/^go / {print $2}' go.mod 2>/dev/null)`,
    psTargetCmd: `(Get-Content go.mod -ErrorAction SilentlyContinue | Select-String '^go ') -replace '^go ',''`,
  }),
  ...makeLanguageBlock("rust", "Rust", "", "rustVersion", "rustTargetVersion", {
    bashCmd: `$(rustc --version 2>/dev/null | awk '{print $2}')`,
    psCmd: `(rustc --version 2>$null) -split ' ' | Select -Index 1`,
  }),
  ...makeLanguageBlock("java", "Java", "☕", "javaVersion", "javaTargetVersion", {
    bashCmd: `$(java --version 2>/dev/null | head -1 | awk '{print $2}')`,
    psCmd: `(java --version 2>$null | Select -First 1) -split ' ' | Select -Index 1`,
  }),
  ...makeLanguageBlock("kotlin", "Kotlin", "", "kotlinVersion", "kotlinTargetVersion", {
    bashCmd: `$(kotlin -version 2>&1 | awk '{print $3}')`,
    psCmd: `(kotlin -version 2>&1) -split ' ' | Select -Index 2`,
  }),
  ...makeLanguageBlock("scala", "Scala", "", "scalaVersion", "scalaTargetVersion", {
    bashCmd: `$(scala -version 2>&1 | awk '{print $5}')`,
    psCmd: `(scala -version 2>&1) -split ' ' | Select -Index 4`,
  }),
  ...makeLanguageBlock("dotnet", ".NET", "", "dotnetVersion", "dotnetTargetVersion", {
    bashCmd: `$(dotnet --version 2>/dev/null)`,
    psCmd: `dotnet --version 2>$null`,
  }),
  ...makeLanguageBlock("php", "PHP", "", "phpVersion", "phpTargetVersion", {
    bashCmd: `$(php -r 'echo PHP_VERSION;' 2>/dev/null)`,
    psCmd: `php -r 'echo PHP_VERSION;' 2>$null`,
  }),
  ...makeLanguageBlock("lua", "Lua", "", "luaVersion", "luaTargetVersion", {
    bashCmd: `$(lua -v 2>&1 | awk '{print $2}')`,
    psCmd: `(lua -v 2>&1) -split ' ' | Select -Index 1`,
  }),
  ...makeLanguageBlock("swift", "Swift", "", "swiftVersion", "swiftTargetVersion", {
    bashCmd: `$(swift --version 2>/dev/null | head -1 | awk '{print $4}')`,
    psCmd: `(swift --version 2>$null | Select -First 1) -split ' ' | Select -Index 3`,
  }),
  ...makeLanguageBlock("dart", "Dart", "", "dartVersion", "dartTargetVersion", {
    bashCmd: `$(dart --version 2>&1 | awk '{print $4}')`,
    psCmd: `(dart --version 2>&1) -split ' ' | Select -Index 3`,
  }),
  ...makeLanguageBlock("elixir", "Elixir", "", "elixirVersion", "elixirTargetVersion", {
    bashCmd: `$(elixir --version 2>/dev/null | tail -1 | awk '{print $2}')`,
    psCmd: `(elixir --version 2>$null | Select -Last 1) -split ' ' | Select -Index 1`,
  }),

  // ─── Cloud blocks ──────────────────────────────────────────────────────────
  ...makeCloudBlock("aws", "AWS", "", "awsProfile", "warning", {
    bashSrc: "$AWS_PROFILE",
    psExpr: "$env:AWS_PROFILE",
  }),
  ...makeCloudBlock("azure", "Azure", "󰠅", "azureSub", "info", {
    bashSrc: "$AZURE_SUBSCRIPTION",
    psExpr: "$env:AZURE_SUBSCRIPTION",
  }),
  ...makeCloudBlock("gcp", "GCP", "", "gcpProject", "info", {
    bashSrc: "$GCLOUD_PROJECT",
    psExpr: "$env:GCLOUD_PROJECT",
  }),
  ...makeCloudBlock("kubernetes", "Kubernetes", "󱃾", "k8sContext", "info", {
    bashSrc: `$(kubectl config current-context 2>/dev/null)`,
    psExpr: `kubectl config current-context 2>$null`,
  }),
  ...makeCloudBlock("docker", "Docker", "", "dockerContext", "info", {
    bashSrc: `${'${DOCKER_CONTEXT:-$(docker context show 2>/dev/null)}'}`,
    psExpr: `if ($env:DOCKER_CONTEXT) { $env:DOCKER_CONTEXT } else { docker context show 2>$null }`,
  }),
  ...makeCloudBlock("helm", "Helm", "", "helmChart", "info", {
    bashSrc: `$(awk '/^version:/ {print $2}' Chart.yaml 2>/dev/null)`,
    psExpr: `(Get-Content Chart.yaml -ErrorAction SilentlyContinue | Select-String '^version:') -replace '^version:\\s*',''`,
  }),
  ...makeCloudBlock("terraform", "Terraform", "", "terraformWorkspace", "info", {
    bashSrc: `$(terraform workspace show 2>/dev/null)`,
    psExpr: `terraform workspace show 2>$null`,
  }),
  ...makeCloudBlock("pulumi", "Pulumi", "", "pulumiStack", "info", {
    bashSrc: `$(pulumi stack --show-name 2>/dev/null)`,
    psExpr: `pulumi stack --show-name 2>$null`,
  }),
];

function makeLanguageBlock(
  id: string,
  name: string,
  iconChar: string,
  versionField: keyof ScenarioData,
  targetField: keyof ScenarioData,
  shell: { bashCmd: string; psCmd: string; bashTargetCmd?: string; psTargetCmd?: string },
): BlockDefinition[] {
  const bashLocal = `_${id.replace(/-/g, "_")}`;
  const psVar = `$_${id.replace(/-/g, "")}Ver`;
  const bashTargetLocal = `_${id.replace(/-/g, "_")}_tgt`;
  const psTargetVar = `$_${id.replace(/-/g, "")}Tgt`;

  const hasTarget = Boolean(shell.bashTargetCmd && shell.psTargetCmd);

  const targetArrow: CaptureDefinition = hasTarget
    ? cap(
        (d) => {
          const t = (d[targetField] as string | undefined) ?? "";
          const v = (d[versionField] as string | undefined) ?? "";
          if (!t || t === v) return "";
          return ` → ${t}`;
        },
        bashCap(
          [`local ${bashTargetLocal}; ${bashTargetLocal}=${shell.bashTargetCmd}`],
          ` → $${bashTargetLocal}`,
          `[[ -n "$${bashTargetLocal}" ]]`,
        ),
        psCap(
          [`${psTargetVar} = ${shell.psTargetCmd}`],
          ` → ${psTargetVar}`,
          psTargetVar,
        ),
        { optional: true },
      )
    : emptyCap();

  return [
    {
      id,
      name,
      category: "language",
      surfaces: ["terminal-prompt"],
      captures: {
        version: cap(
          (d) => (d[versionField] as string | undefined) ?? "",
          bashCap(
            [`local ${bashLocal}; ${bashLocal}=${shell.bashCmd}`],
            `$${bashLocal}`,
            `[[ -n "$${bashLocal}" ]]`,
          ),
          psCap([`${psVar} = ${shell.psCmd}`], psVar, psVar),
        ),
        targetArrow,
        pkgMgr: emptyCap(),
        framework: emptyCap(),
      },
      elements: {
        version: { capture: "version", role: "content" },
        targetArrow: { capture: "targetArrow", role: "content" },
        pkgMgr: { capture: "pkgMgr", role: "content" },
        framework: { capture: "framework", role: "content" },
        icon: { value: iconChar, role: "icon" },
        connector: { value: "via", role: "connector" },
      },
      styles: {
        minimal: "{icon} {version}",
        compare: "{icon} {version}{targetArrow}",
        extended: "{icon} {version} {pkgMgr} {framework}",
        max: "{icon} {version}{targetArrow} {pkgMgr} {framework}",
      },
      themeSlot: "info",
      defaultStyle: "minimal",
      exportCosts: { "bash-ps1": 0, "powershell-prompt": 0 },
    },
  ];
}

function makeCloudBlock(
  id: string,
  name: string,
  iconChar: string,
  scenarioField: keyof ScenarioData,
  themeSlot: string,
  shell: { bashSrc: string; psExpr: string },
): BlockDefinition[] {
  const bashLocal = `_cloud_${id.replace(/-/g, "_")}`;
  const psVar = `$_cloud${id.replace(/-/g, "")}`;

  return [
    {
      id,
      name,
      category: "cloud",
      surfaces: ["terminal-prompt"],
      captures: {
        value: cap(
          (d) => (d[scenarioField] as string | undefined) ?? "",
          bashCap(
            [`local ${bashLocal}; ${bashLocal}=${shell.bashSrc}`],
            `$${bashLocal}`,
            `[[ -n "$${bashLocal}" ]]`,
          ),
          psCap([`${psVar} = ${shell.psExpr}`], psVar, psVar),
        ),
      },
      elements: {
        value: { capture: "value", role: "content" },
        icon: { value: iconChar, role: "icon" },
        connector: { value: "on", role: "connector" },
      },
      styles: {
        default: "{icon} {value}",
      },
      themeSlot,
      defaultStyle: "default",
      exportCosts: { "bash-ps1": 0, "powershell-prompt": 0 },
    },
  ];
}

export const BLOCKS: BlockDefinition[] = blocks;

export const CATEGORY_ORDER = ["essential", "vcs", "status", "language", "cloud"] as const;

export function getBlocksForSurface(surfaceId: string): BlockDefinition[] {
  return blocks.filter((b) => b.surfaces.includes(surfaceId));
}

export function getBlocksByCategoryForSurface(surfaceId: string): Record<string, BlockDefinition[]> {
  const surfaceBlocks = getBlocksForSurface(surfaceId);
  const grouped: Record<string, BlockDefinition[]> = {};

  for (const block of surfaceBlocks) {
    if (!grouped[block.category]) grouped[block.category] = [];
    grouped[block.category].push(block);
  }

  const ordered: Record<string, BlockDefinition[]> = {};
  for (const cat of CATEGORY_ORDER) if (grouped[cat]) ordered[cat] = grouped[cat];
  for (const cat of Object.keys(grouped)) if (!ordered[cat]) ordered[cat] = grouped[cat];
  return ordered;
}

export function getBlockById(id: string): BlockDefinition | undefined {
  return blocks.find((b) => b.id === id);
}
