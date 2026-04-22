import type { BlockDefinition, CaptureDefinition } from "../types";

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

const blocks: BlockDefinition[] = [
  {
    id: "user",
    name: "Username",
    category: "essential",
    surfaces: ["terminal-prompt"],
    captures: {
      username: cap(
        (d) => d.user ?? "",
        bashCap([], "\\u", BASH_ALWAYS),
        psCap([], "$env:USERNAME", PS_ALWAYS),
      ),
    },
    elements: {
      username: { capture: "username", role: "content" },
      icon: { value: "", role: "icon" },
      connector: { value: "as", role: "connector" },
    },
    styles: { zen: "{username}", minimal: "{username}", extended: "{icon} {username}" },
    themeSlot: "user",
    defaultStyle: "minimal",
    exportCosts: { "bash-ps1": 0, "powershell-prompt": 0 },
  },
  {
    id: "host",
    name: "Hostname",
    category: "essential",
    surfaces: ["terminal-prompt"],
    captures: {
      hostname: cap(
        (d) => d.host ?? "",
        bashCap([], "\\h", BASH_ALWAYS),
        psCap([], "$env:COMPUTERNAME", PS_ALWAYS),
      ),
    },
    elements: {
      hostname: { capture: "hostname", role: "content" },
      icon: { value: "🖳", role: "icon" },
      connector: { value: "at", role: "connector" },
    },
    styles: { zen: "{hostname}", minimal: "{hostname}", extended: "{icon} {hostname}" },
    themeSlot: "host",
    defaultStyle: "minimal",
    exportCosts: { "bash-ps1": 0, "powershell-prompt": 0 },
  },
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
      icon: { value: "🗀", role: "icon" },
      connector: { value: "in", role: "connector" },
    },
    styles: { zen: "{dir}", minimal: "{icon} {dir}", extended: "{icon} {dir}" },
    themeSlot: "path",
    defaultStyle: "minimal",
    exportCosts: { "bash-ps1": 0, "powershell-prompt": 0 },
  },
  {
    id: "git-branch",
    name: "Git Branch",
    category: "git",
    surfaces: ["terminal-prompt"],
    captures: {
      branch: cap(
        (d) => d.branch ?? "",
        bashCap(
          [`local _branch; _branch=$(git branch --show-current 2>/dev/null)`],
          "$_branch",
          `[[ -n "$_branch" ]]`,
        ),
        psCap(
          [`$branch = git branch --show-current 2>$null`],
          "$branch",
          "$branch",
        ),
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
            `$gitCounts = git rev-list --count --left-right "@{upstream}...HEAD" 2>$null`,
            `$aheadN = if ($gitCounts) { ($gitCounts -split "\`t")[1] } else { "0" }`,
          ],
          "↑$aheadN",
          "[int]$aheadN -gt 0",
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
            `$gitCounts = git rev-list --count --left-right "@{upstream}...HEAD" 2>$null`,
            `$behindN = if ($gitCounts) { ($gitCounts -split "\`t")[0] } else { "0" }`,
          ],
          "↓$behindN",
          "[int]$behindN -gt 0",
        ),
        { optional: true },
      ),
      dirty: cap(
        (d) => (d.dirty ? "*" : ""),
        bashCap(
          [`local _dirty; _dirty=$(git status --porcelain 2>/dev/null | head -1)`],
          "*",
          `[ -n "$_dirty" ]`,
        ),
        psCap(
          [`$dirty = git status --porcelain 2>$null | Select-Object -First 1`],
          "*",
          "$dirty",
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
      connector: { value: "on", role: "connector" },
    },
    styles: {
      zen: "{dirty} {branch}",
      minimal: "{icon} {branch} {dirty}",
      extended: "{icon} {branch} {ahead}{behind} {dirty}",
    },
    themeSlot: "vcs",
    defaultStyle: "minimal",
    exportCosts: { "bash-ps1": 0, "powershell-prompt": 0 },
  },
  {
    id: "git-status",
    name: "Git Status",
    category: "git",
    surfaces: ["terminal-prompt"],
    captures: {
      staged: cap(
        (d) => (d.staged && d.staged > 0 ? `+${d.staged}` : ""),
        bashCap(
          [`local _staged; _staged=$(git diff --cached --name-only 2>/dev/null | wc -l | tr -d ' ')`],
          "+$_staged",
          `[ "$_staged" -gt 0 ]`,
        ),
        psCap(
          [`$staged = (git diff --cached --name-only 2>$null | Measure-Object -Line).Lines`],
          "+$staged",
          "$staged -gt 0",
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
          [`$unstaged = (git diff --name-only 2>$null | Measure-Object -Line).Lines`],
          "~$unstaged",
          "$unstaged -gt 0",
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
          [`$untracked = (git ls-files --others --exclude-standard 2>$null | Measure-Object -Line).Lines`],
          "?$untracked",
          "$untracked -gt 0",
        ),
        { optional: true },
      ),
    },
    elements: {
      staged: { capture: "staged", role: "content" },
      unstaged: { capture: "unstaged", role: "content" },
      untracked: { capture: "untracked", role: "content" },
      icon: { value: "", role: "icon" },
      connector: { value: "", role: "connector" },
    },
    styles: {
      zen: "{staged}{unstaged}{untracked}",
      minimal: "{icon} {staged}{unstaged}{untracked}",
      extended: "{icon} {staged} {unstaged} {untracked}",
    },
    themeSlot: "vcs",
    defaultStyle: "minimal",
    exportCosts: { "bash-ps1": 0, "powershell-prompt": 0 },
  },
  {
    id: "exit-code",
    name: "Exit Code",
    category: "status",
    surfaces: ["terminal-prompt"],
    captures: {
      code: cap(
        (d) => (d.exitCode && d.exitCode !== 0 ? String(d.exitCode) : ""),
        bashCap([], "$_last_exit", `[[ $_last_exit -ne 0 ]]`),
        psCap([], "$exitCode", "$exitCode -ne 0"),
      ),
    },
    elements: {
      code: { capture: "code", role: "content" },
      icon: { value: "✗", role: "icon" },
      connector: { value: "", role: "connector" },
    },
    styles: { zen: "{code}", minimal: "{icon}{code}", extended: "{icon} exit:{code}" },
    themeSlot: "error",
    defaultStyle: "minimal",
    exportCosts: { "bash-ps1": 0, "powershell-prompt": 0 },
  },
  {
    id: "time",
    name: "Time",
    category: "status",
    surfaces: ["terminal-prompt"],
    captures: {
      time: cap(
        (d) => d.time ?? "",
        bashCap([], "\\t", BASH_ALWAYS),
        psCap([], "$(Get-Date -Format 'HH:mm:ss')", PS_ALWAYS),
      ),
    },
    elements: {
      time: { capture: "time", role: "content" },
      icon: { value: "", role: "icon" },
      connector: { value: "", role: "connector" },
    },
    styles: { zen: "{time}", minimal: "{icon} {time}", extended: "{icon} {time}" },
    themeSlot: "info",
    defaultStyle: "minimal",
    exportCosts: { "bash-ps1": 0, "powershell-prompt": 0 },
  },
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
          [`$jobCount = @(Get-Job | Where-Object { $_.State -eq 'Running' }).Count`],
          "$jobCount",
          "$jobCount -gt 0",
        ),
      ),
    },
    elements: {
      count: { capture: "count", role: "content" },
      icon: { value: "✦", role: "icon" },
      connector: { value: "", role: "connector" },
    },
    styles: { zen: "{count}", minimal: "{icon}{count}", extended: "{icon} {count} jobs" },
    themeSlot: "info",
    defaultStyle: "minimal",
    exportCosts: { "bash-ps1": 0, "powershell-prompt": 0 },
  },
  {
    id: "cmd-duration",
    name: "Command Duration",
    category: "status",
    surfaces: ["terminal-prompt"],
    captures: {
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
            `$elapsed = [int]((Get-Date) - $global:TtCmdStart).TotalMilliseconds`,
            `$dur = if ($elapsed -ge 60000) { "$([int]($elapsed/60000))m$([int](($elapsed%60000)/1000))s" } else { "$([int]($elapsed/1000))s" }`,
          ],
          "$dur",
          "$elapsed -ge 1000",
        ),
      ),
    },
    elements: {
      duration: { capture: "duration", role: "content" },
      icon: { value: "", role: "icon" },
      connector: { value: "took", role: "connector" },
    },
    styles: { zen: "{duration}", minimal: "{icon} {duration}", extended: "{icon} {duration}" },
    themeSlot: "info",
    defaultStyle: "minimal",
    exportCosts: { "bash-ps1": 0, "powershell-prompt": 0 },
  },
  // ─── Environment version blocks ─────────────────────────────────────────────
  ...makeEnvVersionBlock("node-version", "Node.js Version", "node", "nodeVersion", {
    bashCmd: `$(node --version 2>/dev/null | sed 's/v//')`,
    bashLocal: "_node",
    psCmd: `(node --version 2>$null) -replace '^v',''`,
    psVar: "$nodeVer",
  }),
  ...makeEnvVersionBlock("python-version", "Python Version", "py", "pythonVersion", {
    bashCmd: `$(python3 --version 2>/dev/null | awk '{print $2}')`,
    bashLocal: "_python",
    psCmd: `(python3 --version 2>$null) -replace 'Python ',''`,
    psVar: "$pythonVer",
  }),
  ...makeEnvVersionBlock("ruby-version", "Ruby Version", "", "rubyVersion", {
    bashCmd: `$(ruby --version 2>/dev/null | awk '{print $2}')`,
    bashLocal: "_ruby",
    psCmd: `(ruby --version 2>$null) -split ' ' | Select -Index 1`,
    psVar: "$rubyVer",
  }),
  ...makeEnvVersionBlock("golang-version", "Go Version", "", "golangVersion", {
    bashCmd: `$(go version 2>/dev/null | awk '{print $3}' | sed 's/go//')`,
    bashLocal: "_go",
    psCmd: `(go version 2>$null) -replace '.*go([\\d.]+).*','$1'`,
    psVar: "$goVer",
  }),
  ...makeEnvVersionBlock("rust-version", "Rust Version", "", "rustVersion", {
    bashCmd: `$(rustc --version 2>/dev/null | awk '{print $2}')`,
    bashLocal: "_rust",
    psCmd: `(rustc --version 2>$null) -split ' ' | Select -Index 1`,
    psVar: "$rustVer",
  }),
  ...makeEnvVersionBlock("java-version", "Java Version", "", "javaVersion", {
    bashCmd: `$(java --version 2>/dev/null | head -1 | awk '{print $2}')`,
    bashLocal: "_java",
    psCmd: `(java --version 2>$null | Select -First 1) -split ' ' | Select -Index 1`,
    psVar: "$javaVer",
  }),
  // ─── Cloud blocks ───────────────────────────────────────────────────────────
  ...makeCloudBlock("aws-profile", "AWS Profile", "", "awsProfile", "warning", {
    bashSrc: "$AWS_PROFILE", bashLocal: "_aws", psExpr: "$env:AWS_PROFILE", psVar: "$awsProfile",
  }),
  ...makeCloudBlock("azure-subscription", "Azure Subscription", "󰠅", "azureSub", "info", {
    bashSrc: "$AZURE_SUBSCRIPTION", bashLocal: "_azure", psExpr: "$env:AZURE_SUBSCRIPTION", psVar: "$azureSub",
  }),
  ...makeCloudBlock("gcp-project", "GCP Project", "", "gcpProject", "info", {
    bashSrc: "$GCLOUD_PROJECT", bashLocal: "_gcp", psExpr: "$env:GCLOUD_PROJECT", psVar: "$gcpProject",
  }),
  ...makeCloudBlock("kubernetes-context", "Kubernetes Context", "󱃾", "k8sContext", "info", {
    bashSrc: `$(kubectl config current-context 2>/dev/null)`,
    bashLocal: "_k8s",
    psExpr: `kubectl config current-context 2>$null`,
    psVar: "$k8sCtx",
  }),
];

function makeEnvVersionBlock(
  id: string,
  name: string,
  iconChar: string,
  scenarioField: keyof import("../types").ScenarioData,
  shell: { bashCmd: string; bashLocal: string; psCmd: string; psVar: string },
): BlockDefinition[] {
  return [
    {
      id,
      name,
      category: "environment",
      surfaces: ["terminal-prompt"],
      captures: {
        version: cap(
          (d) => (d[scenarioField] as string | undefined) ?? "",
          bashCap(
            [`local ${shell.bashLocal}; ${shell.bashLocal}=${shell.bashCmd}`],
            `$${shell.bashLocal}`,
            `[[ -n "$${shell.bashLocal}" ]]`,
          ),
          psCap([`${shell.psVar} = ${shell.psCmd}`], shell.psVar, shell.psVar),
        ),
      },
      elements: {
        version: { capture: "version", role: "content" },
        icon: { value: iconChar || (id === "node-version" ? "node" : id === "python-version" ? "py" : ""), role: "icon" },
        connector: { value: "via", role: "connector" },
      },
      styles: { zen: "{version}", minimal: "{icon} {version}", extended: "{icon} v{version}" },
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
  scenarioField: keyof import("../types").ScenarioData,
  themeSlot: string,
  shell: { bashSrc: string; bashLocal: string; psExpr: string; psVar: string },
): BlockDefinition[] {
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
            [`local ${shell.bashLocal}; ${shell.bashLocal}=${shell.bashSrc}`],
            `$${shell.bashLocal}`,
            `[[ -n "$${shell.bashLocal}" ]]`,
          ),
          psCap([`${shell.psVar} = ${shell.psExpr}`], shell.psVar, shell.psVar),
        ),
      },
      elements: {
        value: { capture: "value", role: "content" },
        icon: { value: iconChar, role: "icon" },
        connector: { value: "on", role: "connector" },
      },
      styles: { zen: "{value}", minimal: "{icon} {value}", extended: "{icon} {value}" },
      themeSlot,
      defaultStyle: "minimal",
      exportCosts: { "bash-ps1": 0, "powershell-prompt": 0 },
    },
  ];
}

export const BLOCKS: BlockDefinition[] = blocks;

export const CATEGORY_ORDER = ["essential", "git", "status", "environment", "cloud"] as const;

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
