import type { SurfaceConfig, CodeSection, ZoneLayoutType, BlockDefinition } from "../types";
import type { ThemeDefinition } from "../data/themes";
import { getBlockById } from "../data/blocks";
import { getSurfaceById } from "../data/surfaces";

// ─── Color utilities ──────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

// PowerShell truecolor fg escape: [char]27 + '[38;2;R;G;Bm'
function psColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "";
  return `[char]27 + '[38;2;${rgb[0]};${rgb[1]};${rgb[2]}m'`;
}

// PowerShell truecolor bg escape
function psBgColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "";
  return `[char]27 + '[48;2;${rgb[0]};${rgb[1]};${rgb[2]}m'`;
}

const PS_RESET = `[char]27 + '[0m'`;

// ─── Theme slot resolution ────────────────────────────────────────────────────

function resolveSlot(slot: string, theme: ThemeDefinition): string | null {
  const direct = theme.tokens[`--tt-color-${slot}`];
  if (direct) return direct;
  const dash = slot.lastIndexOf("-");
  if (dash > 0) return theme.tokens[`--tt-color-${slot.slice(0, dash)}`] ?? null;
  return null;
}

// Returns PS variable name: $TtColorVcs, $TtColorPath, etc.
function psVarName(slot: string, theme: ThemeDefinition): string {
  let root = slot;
  if (!theme.tokens[`--tt-color-${slot}`]) {
    const dash = slot.lastIndexOf("-");
    if (dash > 0) root = slot.slice(0, dash);
  }
  // PascalCase: vcs-ahead → VcsAhead
  const pascal = root
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
  return `$TtColor${pascal}`;
}

function templateElems(template: string): Set<string> {
  const elems = new Set<string>();
  for (const m of template.matchAll(/\{(\w+)\}/g)) elems.add(m[1]);
  return elems;
}

function blockIcon(block: BlockDefinition): string {
  return Object.values(block.elements).find((e) => e.role === "icon")?.value ?? "";
}

function blockConnector(block: BlockDefinition): string {
  return Object.values(block.elements).find((e) => e.role === "connector")?.value ?? "";
}

function blockStyleTemplate(block: BlockDefinition, style: string): string {
  return block.styles[style] ?? block.styles[block.defaultStyle] ?? "";
}

// ─── Colors section ───────────────────────────────────────────────────────────

function collectColorVars(config: SurfaceConfig, theme: ThemeDefinition): Map<string, string> {
  const vars = new Map<string, string>(); // varName → hex
  const hasPl = Object.values(config.zones).some(
    (z) => z.layout === "powerline" || z.layout === "powertab"
  );
  const hasFlow = Object.values(config.zones).some((z) => !z.layout || z.layout === "flow");

  for (const zone of Object.values(config.zones)) {
    for (const inst of zone.blocks) {
      const block = getBlockById(inst.blockId);
      if (!block) continue;
      addSlot(block.themeSlot, theme, vars, hasPl);
      for (const elem of Object.values(block.elements)) {
        if (elem.themeSlot) addSlot(elem.themeSlot, theme, vars, hasPl);
      }
    }
  }

  if (hasFlow) {
    const muted = theme.tokens["--tt-text-muted"];
    if (muted) vars.set("$TtMuted", muted);
  }

  return vars;
}

function addSlot(
  slot: string,
  theme: ThemeDefinition,
  vars: Map<string, string>,
  includeBg: boolean
) {
  const hex = resolveSlot(slot, theme);
  if (!hex) return;
  const name = psVarName(slot, theme);
  if (!vars.has(name)) vars.set(name, hex);
  if (includeBg) {
    const bgName = name.replace("$TtColor", "$TtBg");
    if (!vars.has(bgName)) vars.set(bgName, hex);
  }
}

function generateColorsSection(config: SurfaceConfig, theme: ThemeDefinition): string {
  const vars = collectColorVars(config, theme);
  const lines: string[] = ["# Add to $PROFILE", ""];

  for (const [name, hex] of vars) {
    const isBg = name.includes("$TtBg");
    lines.push(`${name} = ${isBg ? psBgColor(hex) : psColor(hex)}`);
  }
  lines.push(`$TtReset = ${PS_RESET}`);
  return lines.join("\n");
}

// ─── Per-block generators ─────────────────────────────────────────────────────

interface PsBlockCode {
  lines: string[];
  needsExitCapture?: boolean;
  needsTimerSetup?: boolean;
}

function psConnector(connector: string, layout: ZoneLayoutType): string {
  if (layout !== "flow") return "";
  return connector ? `"$TtMuted${connector}$TtReset "` : "";
}

function generateCwdBlock(style: string, layout: ZoneLayoutType, theme: ThemeDefinition): PsBlockCode {
  const block = getBlockById("cwd")!;
  const elems = templateElems(blockStyleTemplate(block, style));
  const icon = elems.has("icon") ? `"${blockIcon(block)} " + ` : "";
  const colorVar = psVarName(block.themeSlot, theme);
  const conn = psConnector(blockConnector(block), layout);
  const pref = conn ? `${conn} + ` : "";
  let line: string;
  if (layout === "brackets") {
    line = `$prompt += ${pref}"${colorVar}" + ${icon}(Get-Location) + "$TtReset" + "$TtBorder]$TtReset "`;
    // Simplified: just wrap
    line = `$prompt += ${pref}"$TtBorder[$TtReset${colorVar}" + ${icon}(Get-Location) + "$TtReset$TtBorder]$TtReset "`;
  } else {
    line = `$prompt += ${pref}"${colorVar}" + ${icon}(Get-Location) + "$TtReset "`;
  }
  return { lines: [line] };
}

function generateUserBlock(style: string, layout: ZoneLayoutType, theme: ThemeDefinition): PsBlockCode {
  const block = getBlockById("user")!;
  const elems = templateElems(blockStyleTemplate(block, style));
  const icon = elems.has("icon") ? `"${blockIcon(block)} " + ` : "";
  const colorVar = psVarName(block.themeSlot, theme);
  const conn = psConnector(blockConnector(block), layout);
  const pref = conn ? `${conn} + ` : "";
  return { lines: [`$prompt += ${pref}${icon}"${colorVar}$env:USERNAME$TtReset "`] };
}

function generateHostBlock(style: string, layout: ZoneLayoutType, theme: ThemeDefinition): PsBlockCode {
  const block = getBlockById("host")!;
  const elems = templateElems(blockStyleTemplate(block, style));
  const icon = elems.has("icon") ? `"${blockIcon(block)} " + ` : "";
  const colorVar = psVarName(block.themeSlot, theme);
  const conn = psConnector(blockConnector(block), layout);
  const pref = conn ? `${conn} + ` : "";
  return { lines: [`$prompt += ${pref}"${colorVar}" + ${icon}"$env:COMPUTERNAME$TtReset "`] };
}

function generateGitBranchBlock(style: string, layout: ZoneLayoutType, theme: ThemeDefinition): PsBlockCode {
  const block = getBlockById("git-branch")!;
  const elems = templateElems(blockStyleTemplate(block, style));
  const colorVar = psVarName("vcs", theme);
  const dirtyColorVar = psVarName("vcs-dirty", theme);
  const aheadColorVar = psVarName("vcs-ahead", theme);
  const behindColorVar = psVarName("vcs-behind", theme);
  const icon = elems.has("icon") ? `${blockIcon(block)} ` : "";
  const conn = psConnector(blockConnector(block), layout);
  const pref = conn ? `${conn} + ` : "";

  const lines: string[] = [
    `$branch = git branch --show-current 2>$null`,
    `if ($branch) {`,
  ];

  if (elems.has("dirty")) {
    lines.push(`    $dirty = git status --porcelain 2>$null | Select-Object -First 1`);
  }
  if (elems.has("ahead") || elems.has("behind")) {
    lines.push(`    $gitCounts = git rev-list --count --left-right "@{upstream}...HEAD" 2>$null`);
    lines.push(`    $behindN = if ($gitCounts) { ($gitCounts -split "\t")[0] } else { "0" }`);
    lines.push(`    $aheadN = if ($gitCounts) { ($gitCounts -split "\t")[1] } else { "0" }`);
  }

  if (style === "zen") {
    lines.push(`    $dirtyMark = if ($dirty) { "${dirtyColorVar}* " } else { "" }`);
    lines.push(`    $prompt += ${pref}"${colorVar}" + $dirtyMark + "${colorVar}$branch$TtReset "`);
  } else {
    let contentExpr = `${pref}"${colorVar}${icon}$branch"`;
    if (elems.has("ahead")) {
      contentExpr += ` + (if ([int]$aheadN -gt 0) { " ${aheadColorVar}↑$aheadN${colorVar}" } else { "" })`;
    }
    if (elems.has("behind")) {
      contentExpr += ` + (if ([int]$behindN -gt 0) { " ${behindColorVar}↓$behindN${colorVar}" } else { "" })`;
    }
    if (elems.has("dirty")) {
      contentExpr += ` + (if ($dirty) { " ${dirtyColorVar}*" } else { "" })`;
    }
    lines.push(`    $prompt += ${contentExpr} + "$TtReset "`);
  }
  lines.push(`}`);
  return { lines };
}

function generateGitStatusBlock(style: string, layout: ZoneLayoutType, theme: ThemeDefinition): PsBlockCode {
  const block = getBlockById("git-status")!;
  const colorVar = psVarName("vcs", theme);
  const elems = templateElems(blockStyleTemplate(block, style));
  const icon = elems.has("icon") ? `${blockIcon(block)} ` : "";
  const sep = style === "extended" ? " " : "";
  const conn = psConnector(blockConnector(block), layout);
  const pref = conn ? `${conn} + ` : "";
  return {
    lines: [
      `$staged = (git diff --cached --name-only 2>$null | Measure-Object -Line).Lines`,
      `$unstaged = (git diff --name-only 2>$null | Measure-Object -Line).Lines`,
      `$untracked = (git ls-files --others --exclude-standard 2>$null | Measure-Object -Line).Lines`,
      `if ($staged -gt 0 -or $unstaged -gt 0 -or $untracked -gt 0) {`,
      `    $gs = "${colorVar}${icon}"`,
      `    if ($staged -gt 0) { $gs += "+$staged${sep}" }`,
      `    if ($unstaged -gt 0) { $gs += "~$unstaged${sep}" }`,
      `    if ($untracked -gt 0) { $gs += "?$untracked" }`,
      `    $prompt += ${pref}$gs + "$TtReset "`,
      `}`,
    ],
  };
}

function generateExitCodeBlock(style: string, _layout: ZoneLayoutType, theme: ThemeDefinition): PsBlockCode {
  const block = getBlockById("exit-code")!;
  const colorVar = psVarName(block.themeSlot, theme);
  const elems = templateElems(blockStyleTemplate(block, style));
  const icon = elems.has("icon") ? blockIcon(block) : "";
  const label = style === "extended" ? "exit:" : "";
  return {
    lines: [
      `if ($exitCode -ne 0) {`,
      `    $prompt += "${colorVar}${icon}${label}$exitCode$TtReset "`,
      `}`,
    ],
    needsExitCapture: true,
  };
}

function generateTimeBlock(style: string, layout: ZoneLayoutType, theme: ThemeDefinition): PsBlockCode {
  const block = getBlockById("time")!;
  const colorVar = psVarName(block.themeSlot, theme);
  const elems = templateElems(blockStyleTemplate(block, style));
  const icon = elems.has("icon") ? `${blockIcon(block)} ` : "";
  const conn = psConnector(blockConnector(block), layout);
  const pref = conn ? `${conn} + ` : "";
  return {
    lines: [`$prompt += ${pref}"${colorVar}${icon}$(Get-Date -Format 'HH:mm:ss')$TtReset "`],
  };
}

function generateJobsBlock(style: string, _layout: ZoneLayoutType, theme: ThemeDefinition): PsBlockCode {
  const block = getBlockById("jobs")!;
  const colorVar = psVarName(block.themeSlot, theme);
  const elems = templateElems(blockStyleTemplate(block, style));
  const icon = elems.has("icon") ? blockIcon(block) : "";
  const suffix = style === "extended" ? " jobs" : "";
  return {
    lines: [
      `$jobCount = @(Get-Job | Where-Object { $_.State -eq 'Running' }).Count`,
      `if ($jobCount -gt 0) {`,
      `    $prompt += "${colorVar}${icon}$jobCount${suffix}$TtReset "`,
      `}`,
    ],
  };
}

function generateCmdDurationBlock(style: string, layout: ZoneLayoutType, theme: ThemeDefinition): PsBlockCode {
  const block = getBlockById("cmd-duration")!;
  const colorVar = psVarName(block.themeSlot, theme);
  const elems = templateElems(blockStyleTemplate(block, style));
  const icon = elems.has("icon") ? `${blockIcon(block)} ` : "";
  const conn = psConnector(blockConnector(block), layout);
  const pref = conn ? `${conn} + ` : "";
  return {
    lines: [
      `$elapsed = [int]((Get-Date) - $global:TtCmdStart).TotalMilliseconds`,
      `if ($elapsed -ge 1000) {`,
      `    $dur = if ($elapsed -ge 60000) { "$([int]($elapsed/60000))m$([int](($elapsed%60000)/1000))s" } else { "$([int]($elapsed/1000))s" }`,
      `    $prompt += ${pref}"${colorVar}${icon}$dur$TtReset "`,
      `}`,
    ],
    needsTimerSetup: true,
  };
}

function generateEnvVersionBlock(
  blockId: string,
  style: string,
  layout: ZoneLayoutType,
  theme: ThemeDefinition
): PsBlockCode {
  const cmds: Record<string, { cmd: string; varName: string }> = {
    "node-version":   { cmd: `(node --version 2>$null) -replace '^v',''`, varName: "$nodeVer" },
    "python-version": { cmd: `(python3 --version 2>$null) -replace 'Python ',''`, varName: "$pythonVer" },
    "ruby-version":   { cmd: `(ruby --version 2>$null) -split ' ' | Select -Index 1`, varName: "$rubyVer" },
    "golang-version": { cmd: `(go version 2>$null) -replace '.*go([\\d.]+).*','$1'`, varName: "$goVer" },
    "rust-version":   { cmd: `(rustc --version 2>$null) -split ' ' | Select -Index 1`, varName: "$rustVer" },
    "java-version":   { cmd: `(java --version 2>$null | Select -First 1) -split ' ' | Select -Index 1`, varName: "$javaVer" },
  };
  const cfg = cmds[blockId];
  if (!cfg) return { lines: [] };

  const block = getBlockById(blockId)!;
  const colorVar = psVarName(block.themeSlot, theme);
  const elems = templateElems(blockStyleTemplate(block, style));
  const icon = elems.has("icon") ? `${blockIcon(block)} ` : "";
  const vPrefix = style === "extended" ? "v" : "";
  const conn = psConnector(blockConnector(block), layout);
  const pref = conn ? `${conn} + ` : "";

  return {
    lines: [
      `${cfg.varName} = ${cfg.cmd}`,
      `if (${cfg.varName}) {`,
      `    $prompt += ${pref}"${colorVar}${icon}${vPrefix}${cfg.varName.replace('$', '$')}$TtReset "`.replace(
        /"\$TtReset "$/,
        `"$TtReset "`
      ),
      `}`,
    ],
  };
}

function generateCloudBlock(
  blockId: string,
  style: string,
  layout: ZoneLayoutType,
  theme: ThemeDefinition
): PsBlockCode {
  const sources: Record<string, { expr: string; varName: string }> = {
    "aws-profile":        { expr: `$env:AWS_PROFILE`, varName: "$awsProfile" },
    "azure-subscription": { expr: `$env:AZURE_SUBSCRIPTION`, varName: "$azureSub" },
    "gcp-project":        { expr: `$env:GCLOUD_PROJECT`, varName: "$gcpProject" },
    "kubernetes-context": { expr: `kubectl config current-context 2>$null`, varName: "$k8sCtx" },
  };
  const cfg = sources[blockId];
  if (!cfg) return { lines: [] };

  const block = getBlockById(blockId)!;
  const colorVar = psVarName(block.themeSlot, theme);
  const elems = templateElems(blockStyleTemplate(block, style));
  const icon = elems.has("icon") ? `${blockIcon(block)} ` : "";
  const conn = psConnector(blockConnector(block), layout);
  const pref = conn ? `${conn} + ` : "";

  return {
    lines: [
      `${cfg.varName} = ${cfg.expr}`,
      `if (${cfg.varName}) {`,
      `    $prompt += ${pref}"${colorVar}${icon}" + ${cfg.varName} + "$TtReset "`,
      `}`,
    ],
  };
}

function generatePsBlock(
  blockId: string,
  style: string,
  layout: ZoneLayoutType,
  theme: ThemeDefinition
): PsBlockCode {
  switch (blockId) {
    case "cwd":                return generateCwdBlock(style, layout, theme);
    case "user":               return generateUserBlock(style, layout, theme);
    case "host":               return generateHostBlock(style, layout, theme);
    case "git-branch":         return generateGitBranchBlock(style, layout, theme);
    case "git-status":         return generateGitStatusBlock(style, layout, theme);
    case "exit-code":          return generateExitCodeBlock(style, layout, theme);
    case "time":               return generateTimeBlock(style, layout, theme);
    case "jobs":               return generateJobsBlock(style, layout, theme);
    case "cmd-duration":       return generateCmdDurationBlock(style, layout, theme);
    case "node-version":
    case "python-version":
    case "ruby-version":
    case "golang-version":
    case "rust-version":
    case "java-version":       return generateEnvVersionBlock(blockId, style, layout, theme);
    case "aws-profile":
    case "azure-subscription":
    case "gcp-project":
    case "kubernetes-context": return generateCloudBlock(blockId, style, layout, theme);
    default:                   return { lines: [] };
  }
}

// ─── Zone helpers ─────────────────────────────────────────────────────────────

function resolveLayout(zoneConfig: { layout?: ZoneLayoutType }, config: SurfaceConfig): ZoneLayoutType {
  return zoneConfig.layout ?? getSurfaceById(config.surfaceId)?.defaultLayout ?? "plain";
}

function isZoneEnabled(zoneId: string, config: SurfaceConfig): boolean {
  const surface = getSurfaceById(config.surfaceId);
  if (!surface) return false;
  const zoneDef = surface.zones.find((z) => z.id === zoneId);
  if (!zoneDef) return false;
  if (!zoneDef.optional) return true;
  return config.zones[zoneId]?.enabled !== false;
}

// ─── Prompt section ───────────────────────────────────────────────────────────

function generatePromptSection(config: SurfaceConfig, theme: ThemeDefinition): string {
  const promptChar = String(config.globalOptions?.["prompt-char"] ?? "❯");
  const multiline = Boolean(config.globalOptions?.["multiline"] ?? false);

  const leftZone = config.zones["left-prompt"];
  const rightZone = config.zones["right-prompt"];

  const leftLayout = resolveLayout(leftZone ?? {}, config);
  const rightLayout = resolveLayout(rightZone ?? {}, config);

  const hasPowerline = [leftLayout, rightLayout].some(
    (l) => l === "powerline" || l === "powertab"
  );
  const hasRight = isZoneEnabled("right-prompt", config) && (rightZone?.blocks.length ?? 0) > 0;

  let needsExitCapture = false;
  let needsTimerSetup = false;
  for (const inst of [...(leftZone?.blocks ?? []), ...(rightZone?.blocks ?? [])]) {
    if (inst.blockId === "exit-code") needsExitCapture = true;
    if (inst.blockId === "cmd-duration") needsTimerSetup = true;
  }

  const lines: string[] = [];

  if (needsTimerSetup) {
    lines.push(`$global:TtCmdStart = Get-Date`, ``);
  }

  lines.push(`function Prompt {`);
  if (hasPowerline) lines.push(`    # Requires Nerd Font`);
  if (needsExitCapture) lines.push(`    $exitCode = $LASTEXITCODE`);
  if (needsTimerSetup) lines.push(`    $global:TtCmdStart = Get-Date`);

  lines.push(`    $prompt = ""`);
  lines.push(``);

  // ── Left prompt ─────────────────────────────────────────────────────────────
  for (const inst of leftZone?.blocks ?? []) {
    const block = getBlockById(inst.blockId);
    if (!block) continue;
    const bc = generatePsBlock(inst.blockId, inst.style, leftLayout, theme);
    lines.push(`    # ${block.name}`);
    for (const l of bc.lines) lines.push(`    ${l}`);
    lines.push(``);
  }

  // ── Right prompt ─────────────────────────────────────────────────────────────
  if (hasRight) {
    lines.push(`    # ── right-prompt (cursor positioning — may be unreliable on resize)`);
    lines.push(`    $rPrompt = ""`);
    lines.push(`    $rLen = 0`);
    lines.push(``);
    for (const inst of rightZone!.blocks) {
      const block = getBlockById(inst.blockId);
      if (!block) continue;
      const bc = generatePsBlock(inst.blockId, inst.style, rightLayout, theme);
      const patched = bc.lines.map((l) => l.replace(/\$prompt \+=/g, "$rPrompt +="));
      lines.push(`    # ${block.name}`);
      for (const l of patched) lines.push(`    ${l}`);
      lines.push(``);
    }
    lines.push(`    if ($rPrompt) {`);
    lines.push(`        $cols = $Host.UI.RawUI.WindowSize.Width`);
    lines.push(`        $rLenClean = ($rPrompt -replace '\x1b[0-9;[]*m','').Length`);
    lines.push(`        $pos = $cols - $rLenClean`);
    lines.push(`        Write-Host -NoNewline "$([char]27)[s$([char]27)[$($pos)G$rPrompt$([char]27)[u"`);
    lines.push(`    }`);
    lines.push(``);
  }

  const newline = multiline ? "`n" : "";
  lines.push(`    return $prompt + "${newline}${promptChar} "`);
  if (needsTimerSetup) {
    // Reset timer at end of Prompt function (after the return expression — no-op since return exits)
    // Instead, reset at start (already done above)
  }
  lines.push(`}`);

  return lines.join("\n");
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function exportPowerShell(config: SurfaceConfig, theme: ThemeDefinition): CodeSection[] {
  return [
    { label: "Colors", code: generateColorsSection(config, theme) },
    { label: "Prompt", code: generatePromptSection(config, theme) },
  ];
}
