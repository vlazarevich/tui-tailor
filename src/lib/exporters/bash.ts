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

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function autoContrastHex(bgHex: string): string {
  const rgb = hexToRgb(bgHex);
  if (!rgb) return "#ffffff";
  const lum = relativeLuminance(rgb);
  return 1.05 / (lum + 0.05) >= (lum + 0.05) / 0.05 ? "#ffffff" : "#000000";
}

// Returns a PS1-wrapped foreground ANSI escape (for use in _ps1 strings)
function fgEscape(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "";
  return `\\[\\e[38;2;${rgb[0]};${rgb[1]};${rgb[2]}m\\]`;
}

// Returns a PS1-wrapped background ANSI escape
function bgEscape(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "";
  return `\\[\\e[48;2;${rgb[0]};${rgb[1]};${rgb[2]}m\\]`;
}

const RESET_ESCAPE = "\\[\\e[0m\\]";

// Raw ANSI-C quoted fg escape (for right-prompt / printf context, no PS1 wrappers)
function rawFg(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "";
  return `$'\\e[38;2;${rgb[0]};${rgb[1]};${rgb[2]}m'`;
}

const RAW_RESET = "$'\\e[0m'";

// ─── Theme slot resolution ────────────────────────────────────────────────────

function resolveSlot(slot: string, theme: ThemeDefinition): string | null {
  const direct = theme.tokens[`--tt-color-${slot}`];
  if (direct) return direct;
  const dash = slot.lastIndexOf("-");
  if (dash > 0) return theme.tokens[`--tt-color-${slot.slice(0, dash)}`] ?? null;
  return null;
}

function slotVarName(slot: string, theme: ThemeDefinition): string {
  if (theme.tokens[`--tt-color-${slot}`]) {
    return `_TT_${slot.toUpperCase().replace(/-/g, "_")}`;
  }
  const dash = slot.lastIndexOf("-");
  const root = dash > 0 ? slot.slice(0, dash) : slot;
  return `_TT_${root.toUpperCase().replace(/-/g, "_")}`;
}

// Returns set of element names referenced in a style template
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

// ─── Collect all color vars needed for this config ───────────────────────────

interface ColorVarInfo {
  fg: string;   // hex
  bg?: string;  // hex (powerline/powertab only)
  acFg?: string; // auto-contrast fg hex (powerline/powertab only)
}

function collectColorVars(config: SurfaceConfig, theme: ThemeDefinition): Map<string, ColorVarInfo> {
  const vars = new Map<string, ColorVarInfo>();
  const hasPowerline = Object.values(config.zones).some(
    (z) => z.layout === "powerline" || z.layout === "powertab"
  );
  const hasFlow = Object.values(config.zones).some((z) => z.layout === "flow" || !z.layout);

  for (const zone of Object.values(config.zones)) {
    for (const inst of zone.blocks) {
      const block = getBlockById(inst.blockId);
      if (!block) continue;

      // Main theme slot
      addSlot(block.themeSlot, theme, vars, hasPowerline);

      // Element-specific slots
      for (const elem of Object.values(block.elements)) {
        if (elem.themeSlot) addSlot(elem.themeSlot, theme, vars, hasPowerline);
      }
    }
  }

  // Muted color for flow layout connectors
  if (hasFlow) {
    const mutedHex = theme.tokens["--tt-text-muted"];
    if (mutedHex) vars.set("_TT_MUTED", { fg: mutedHex });
  }

  return vars;
}

function addSlot(
  slot: string,
  theme: ThemeDefinition,
  vars: Map<string, ColorVarInfo>,
  includeBg: boolean
) {
  const hex = resolveSlot(slot, theme);
  if (!hex) return;
  const name = slotVarName(slot, theme);
  if (vars.has(name)) return;
  const info: ColorVarInfo = { fg: hex };
  if (includeBg) {
    info.bg = hex;
    info.acFg = autoContrastHex(hex);
  }
  vars.set(name, info);
}

// ─── Colors section ───────────────────────────────────────────────────────────

function generateColorsSection(config: SurfaceConfig, theme: ThemeDefinition): string {
  const vars = collectColorVars(config, theme);
  const hasPowerline = Object.values(config.zones).some(
    (z) => z.layout === "powerline" || z.layout === "powertab"
  );
  const lines: string[] = ["# Add to ~/.bashrc", ""];

  for (const [name, info] of vars) {
    lines.push(`${name}='${fgEscape(info.fg)}'`);
    if (hasPowerline && info.bg) {
      lines.push(`${name}_BG='${bgEscape(info.bg)}'`);
      lines.push(`${name}_FG='${fgEscape(info.acFg ?? "#ffffff")}'`);
      // Separator fg: the block's bg color used as a foreground (for powerline glyph)
      lines.push(`${name}_SF='${fgEscape(info.bg)}'`);
    }
  }
  lines.push(`_TT_RESET='${RESET_ESCAPE}'`);

  return lines.join("\n");
}

// ─── Per-block code generators ────────────────────────────────────────────────

interface BlockCode {
  lines: string[];
  needsExitCapture?: boolean;
  needsTimerSetup?: boolean;
}

function indent(lines: string[], n = 2): string[] {
  const pad = " ".repeat(n);
  return lines.map((l) => (l === "" ? "" : pad + l));
}

function connectPrefix(connector: string, layout: ZoneLayoutType): string {
  if (layout !== "flow") return "";
  return connector ? `\${_TT_MUTED}${connector}\${_TT_RESET} ` : "";
}

function wrapBrackets(inner: string, open: string, close: string): string {
  return `\${_TT_BORDER}${open}\${_TT_RESET}${inner}\${_TT_BORDER}${close}\${_TT_RESET}`;
}

function blockAppend(
  content: string,
  slot: string,
  theme: ThemeDefinition,
  layout: ZoneLayoutType,
  connector: string,
  bracket?: { open: string; close: string }
): string {
  const v = slotVarName(slot, theme);
  let inner = `\${${v}}${content}\${_TT_RESET}`;
  if (layout === "brackets" && bracket) {
    inner = wrapBrackets(`\${${v}}${content}\${_TT_RESET}`, bracket.open, bracket.close);
  }
  const prefix = connectPrefix(connector, layout);
  return `_ps1+="${prefix}${inner} "`;
}

function generateCwdBlock(style: string, layout: ZoneLayoutType, theme: ThemeDefinition): BlockCode {
  const block = getBlockById("cwd")!;
  const elems = templateElems(blockStyleTemplate(block, style));
  const content = elems.has("icon") ? `${blockIcon(block)} \\w` : "\\w";
  return {
    lines: [blockAppend(content, block.themeSlot, theme, layout, blockConnector(block), { open: "[", close: "]" })],
  };
}

function generateUserBlock(style: string, layout: ZoneLayoutType, theme: ThemeDefinition): BlockCode {
  const block = getBlockById("user")!;
  const elems = templateElems(blockStyleTemplate(block, style));
  const content = elems.has("icon") ? `${blockIcon(block)} \\u` : "\\u";
  return {
    lines: [blockAppend(content, block.themeSlot, theme, layout, blockConnector(block), { open: "[", close: "]" })],
  };
}

function generateHostBlock(style: string, layout: ZoneLayoutType, theme: ThemeDefinition): BlockCode {
  const block = getBlockById("host")!;
  const elems = templateElems(blockStyleTemplate(block, style));
  const content = elems.has("icon") ? `${blockIcon(block)} \\h` : "\\h";
  return {
    lines: [blockAppend(content, block.themeSlot, theme, layout, blockConnector(block), { open: "[", close: "]" })],
  };
}

function generateGitBranchBlock(
  style: string,
  layout: ZoneLayoutType,
  theme: ThemeDefinition,
  isRight: boolean
): BlockCode {
  const block = getBlockById("git-branch")!;
  const elems = templateElems(blockStyleTemplate(block, style));
  const v = slotVarName("vcs", theme);
  const vDirty = slotVarName("vcs-dirty", theme);
  const vAhead = slotVarName("vcs-ahead", theme);
  const vBehind = slotVarName("vcs-behind", theme);

  const icon = elems.has("icon") ? `${blockIcon(block)} ` : "";
  const connector = connectPrefix(blockConnector(block), layout);
  const prefix = isRight ? "_rps1" : "_ps1";
  const resetVar = isRight ? RAW_RESET : "${_TT_RESET}";
  const colorVar = isRight ? rawFg(resolveSlot("vcs", theme) ?? "#ffffff") : `\${${v}}`;
  const dirtyColorVar = isRight ? rawFg(resolveSlot("vcs-dirty", theme) ?? "#ffffff") : `\${${vDirty}}`;
  const aheadColorVar = isRight ? rawFg(resolveSlot("vcs-ahead", theme) ?? "#ffffff") : `\${${vAhead}}`;
  const behindColorVar = isRight ? rawFg(resolveSlot("vcs-behind", theme) ?? "#ffffff") : `\${${vBehind}}`;

  const lines: string[] = [
    `local _branch; _branch=$(git branch --show-current 2>/dev/null)`,
    `if [[ -n "$_branch" ]]; then`,
  ];

  if (elems.has("ahead") || elems.has("behind")) {
    lines.push(`  local _gitb; _gitb=$(git rev-list --count --left-right @{upstream}...HEAD 2>/dev/null || echo "0\t0")`);
    lines.push(`  local _behind_n; _behind_n=$(echo "$_gitb" | cut -f1)`);
    lines.push(`  local _ahead_n; _ahead_n=$(echo "$_gitb" | cut -f2)`);
  }
  if (elems.has("dirty")) {
    lines.push(`  local _dirty; _dirty=$(git status --porcelain 2>/dev/null | head -1)`);
  }

  let contentParts = `${connector}${colorVar}${icon}$_branch`;

  if (elems.has("ahead") || elems.has("behind")) {
    if (elems.has("ahead")) contentParts += `$([ "$_ahead_n" -gt 0 ] 2>/dev/null && echo " ${aheadColorVar}↑$_ahead_n${colorVar}")`;
    if (elems.has("behind")) contentParts += `$([ "$_behind_n" -gt 0 ] 2>/dev/null && echo " ${behindColorVar}↓$_behind_n${colorVar}")`;
  }
  if (elems.has("dirty")) {
    if (style === "zen") {
      // zen puts dirty before branch — handled differently
      lines.push(`  ${prefix}+="${connector}${colorVar}$([ -n "$_dirty" ] && echo "${dirtyColorVar}* ")${colorVar}$_branch${resetVar} "`);
    } else {
      lines.push(`  ${prefix}+="${contentParts}$([ -n "$_dirty" ] && echo " ${dirtyColorVar}*")${resetVar} "`);
    }
  } else {
    if (style !== "zen") lines.push(`  ${prefix}+="${contentParts}${resetVar} "`);
  }

  lines.push(`fi`);
  return { lines };
}

function generateGitStatusBlock(
  style: string,
  layout: ZoneLayoutType,
  theme: ThemeDefinition
): BlockCode {
  const block = getBlockById("git-status")!;
  const elems = templateElems(blockStyleTemplate(block, style));
  const v = slotVarName("vcs", theme);
  const icon = elems.has("icon") ? `${blockIcon(block)} ` : "";
  const separator = style === "extended" ? " " : "";
  const connector = connectPrefix(blockConnector(block), layout);

  return {
    lines: [
      `local _staged; _staged=$(git diff --cached --name-only 2>/dev/null | wc -l | tr -d ' ')`,
      `local _unstaged; _unstaged=$(git diff --name-only 2>/dev/null | wc -l | tr -d ' ')`,
      `local _untracked; _untracked=$(git ls-files --others --exclude-standard 2>/dev/null | wc -l | tr -d ' ')`,
      `if [[ "$_staged" -gt 0 || "$_unstaged" -gt 0 || "$_untracked" -gt 0 ]]; then`,
      `  _ps1+="${connector}\${${v}}${icon}$([ "$_staged" -gt 0 ] && echo "+$_staged")${separator}$([ "$_unstaged" -gt 0 ] && echo "~$_unstaged")${separator}$([ "$_untracked" -gt 0 ] && echo "?$_untracked")\${_TT_RESET} "`,
      `fi`,
    ],
  };
}

function generateExitCodeBlock(
  style: string,
  _layout: ZoneLayoutType,
  theme: ThemeDefinition
): BlockCode {
  const block = getBlockById("exit-code")!;
  const v = slotVarName(block.themeSlot, theme);
  const elems = templateElems(blockStyleTemplate(block, style));
  const iconPart = elems.has("icon") ? blockIcon(block) : "";
  const labelPart = style === "extended" ? "exit:" : "";
  return {
    lines: [
      `if [[ $_last_exit -ne 0 ]]; then`,
      `  _ps1+="\${${v}}${iconPart}${labelPart}$_last_exit\${_TT_RESET} "`,
      `fi`,
    ],
    needsExitCapture: true,
  };
}

function generateTimeBlock(
  style: string,
  layout: ZoneLayoutType,
  theme: ThemeDefinition
): BlockCode {
  const block = getBlockById("time")!;
  const v = slotVarName(block.themeSlot, theme);
  const elems = templateElems(blockStyleTemplate(block, style));
  const icon = elems.has("icon") ? `${blockIcon(block)} ` : "";
  const connector = connectPrefix(blockConnector(block), layout);
  return {
    lines: [`_ps1+="${connector}\${${v}}${icon}\\t\${_TT_RESET} "`],
  };
}

function generateJobsBlock(style: string, _layout: ZoneLayoutType, theme: ThemeDefinition): BlockCode {
  const block = getBlockById("jobs")!;
  const v = slotVarName(block.themeSlot, theme);
  const elems = templateElems(blockStyleTemplate(block, style));
  const icon = elems.has("icon") ? blockIcon(block) : "";
  const suffix = style === "extended" ? " jobs" : "";
  return {
    lines: [
      `if [[ \\j -gt 0 ]]; then`,
      `  _ps1+="\${${v}}${icon}\\j${suffix}\${_TT_RESET} "`,
      `fi`,
    ],
  };
}

function generateCmdDurationBlock(
  style: string,
  layout: ZoneLayoutType,
  theme: ThemeDefinition
): BlockCode {
  const block = getBlockById("cmd-duration")!;
  const v = slotVarName(block.themeSlot, theme);
  const elems = templateElems(blockStyleTemplate(block, style));
  const icon = elems.has("icon") ? `${blockIcon(block)} ` : "";
  const connector = connectPrefix(blockConnector(block), layout);
  return {
    lines: [
      `if [[ $_cmd_ms -ge 1000 ]]; then`,
      `  local _dur; _dur=$(( _cmd_ms / 1000 ))s`,
      `  [[ $_cmd_ms -ge 60000 ]] && _dur="$(( _cmd_ms / 60000 ))m$(( (_cmd_ms % 60000) / 1000 ))s"`,
      `  _ps1+="${connector}\${${v}}${icon}$_dur\${_TT_RESET} "`,
      `fi`,
    ],
    needsTimerSetup: true,
  };
}

function generateEnvVersionBlock(
  blockId: string,
  style: string,
  layout: ZoneLayoutType,
  theme: ThemeDefinition
): BlockCode {
  const cmds: Record<string, { cmd: string; local: string }> = {
    "node-version":   { cmd: `$(node --version 2>/dev/null | sed 's/v//')`, local: "_node" },
    "python-version": { cmd: `$(python3 --version 2>/dev/null | awk '{print $2}')`, local: "_python" },
    "ruby-version":   { cmd: `$(ruby --version 2>/dev/null | awk '{print $2}')`, local: "_ruby" },
    "golang-version": { cmd: `$(go version 2>/dev/null | awk '{print $3}' | sed 's/go//')`, local: "_go" },
    "rust-version":   { cmd: `$(rustc --version 2>/dev/null | awk '{print $2}')`, local: "_rust" },
    "java-version":   { cmd: `$(java --version 2>/dev/null | head -1 | awk '{print $2}')`, local: "_java" },
  };
  const cfg = cmds[blockId];
  if (!cfg) return { lines: [] };

  const block = getBlockById(blockId)!;
  const v = slotVarName(block.themeSlot, theme);
  const elems = templateElems(blockStyleTemplate(block, style));
  const icon = elems.has("icon") ? `${blockIcon(block)} ` : "";
  const vPrefix = style === "extended" ? "v" : "";
  const connector = connectPrefix(blockConnector(block), layout);

  return {
    lines: [
      `local ${cfg.local}; ${cfg.local}=${cfg.cmd}`,
      `if [[ -n "$${cfg.local}" ]]; then`,
      `  _ps1+="${connector}\${${v}}${icon}${vPrefix}$${cfg.local}\${_TT_RESET} "`,
      `fi`,
    ],
  };
}

function generateCloudBlock(
  blockId: string,
  style: string,
  layout: ZoneLayoutType,
  theme: ThemeDefinition
): BlockCode {
  const sources: Record<string, { source: string; local: string }> = {
    "aws-profile":          { source: "$AWS_PROFILE", local: "_aws" },
    "azure-subscription":   { source: "$AZURE_SUBSCRIPTION", local: "_azure" },
    "gcp-project":          { source: "$GCLOUD_PROJECT", local: "_gcp" },
    "kubernetes-context":   { source: `$(kubectl config current-context 2>/dev/null)`, local: "_k8s" },
  };
  const cfg = sources[blockId];
  if (!cfg) return { lines: [] };

  const block = getBlockById(blockId)!;
  const v = slotVarName(block.themeSlot, theme);
  const elems = templateElems(blockStyleTemplate(block, style));
  const icon = elems.has("icon") ? `${blockIcon(block)} ` : "";
  const connector = connectPrefix(blockConnector(block), layout);

  return {
    lines: [
      `local ${cfg.local}; ${cfg.local}=${cfg.source}`,
      `if [[ -n "$${cfg.local}" ]]; then`,
      `  _ps1+="${connector}\${${v}}${icon}$${cfg.local}\${_TT_RESET} "`,
      `fi`,
    ],
  };
}

// ─── Dispatch per blockId ─────────────────────────────────────────────────────

function generateBlockCode(
  blockId: string,
  style: string,
  layout: ZoneLayoutType,
  theme: ThemeDefinition,
  isRight = false
): BlockCode {
  switch (blockId) {
    case "cwd":                return generateCwdBlock(style, layout, theme);
    case "user":               return generateUserBlock(style, layout, theme);
    case "host":               return generateHostBlock(style, layout, theme);
    case "git-branch":         return generateGitBranchBlock(style, layout, theme, isRight);
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

// ─── Powerline zone code ──────────────────────────────────────────────────────

function generatePowerlineZoneCode(
  zoneConfig: { blocks: Array<{ blockId: string; style: string }>; layout?: ZoneLayoutType },
  theme: ThemeDefinition,
  separator: string,
  _terminator: string
): string[] {
  const lines: string[] = [
    `# Requires Nerd Font`,
    `declare -a _segs _bgs _fgs _sfs`,
    ``,
  ];

  for (const inst of zoneConfig.blocks) {
    const block = getBlockById(inst.blockId);
    if (!block) continue;
    const bgVar = slotVarName(block.themeSlot, theme) + "_BG";
    const fgVar = slotVarName(block.themeSlot, theme) + "_FG";
    const sfVar = slotVarName(block.themeSlot, theme) + "_SF";

    // Get the block's content expression
    const inner = generatePowerlineBlockContent(inst.blockId, inst.style, theme);
    if (!inner) continue;

    if (inner.alwaysVisible) {
      lines.push(`_segs+=("${inner.content}"); _bgs+=("\${${bgVar}}"); _fgs+=("\${${fgVar}}"); _sfs+=("\${${sfVar}}")`);
    } else {
      lines.push(...inner.preamble);
      lines.push(`if ${inner.condition}; then`);
      lines.push(`  _segs+=("${inner.content}"); _bgs+=("\${${bgVar}}"); _fgs+=("\${${fgVar}}"); _sfs+=("\${${sfVar}}")`);
      lines.push(`fi`);
    }
    lines.push(``);
  }

  // Render powerline segments
  lines.push(
    `local _n=\${#_segs[@]}`,
    `for (( _i=0; _i<_n; _i++ )); do`,
    `  _ps1+="\${_fgs[$_i]}\${_bgs[$_i]} \${_segs[$_i]} "`,
    `  if (( _i + 1 < _n )); then`,
    `    _ps1+="\${_sfs[$_i]}\${_bgs[$_i+1]}\\[${separator}\\]"`,
    `  else`,
    `    _ps1+="\${_sfs[$_i]}\\[\\e[0m\\]\\[${separator}\\]\\[\\e[0m\\]"`,
    `  fi`,
    `done`,
    `unset _segs _bgs _fgs _sfs _n`
  );

  return lines;
}

interface PowerlineBlockContent {
  alwaysVisible: boolean;
  preamble: string[];
  condition: string;
  content: string;
}

function generatePowerlineBlockContent(
  blockId: string,
  style: string,
  _theme: ThemeDefinition
): PowerlineBlockContent | null {
  switch (blockId) {
    case "cwd":
      return { alwaysVisible: true, preamble: [], condition: "", content: "\\w" };
    case "user":
      return { alwaysVisible: true, preamble: [], condition: "", content: "\\u" };
    case "host":
      return { alwaysVisible: true, preamble: [], condition: "", content: "\\h" };
    case "time":
      return { alwaysVisible: true, preamble: [], condition: "", content: "\\t" };
    case "git-branch": {
      const gitBranchBlock = getBlockById("git-branch")!;
      const elems = templateElems(blockStyleTemplate(gitBranchBlock, style));
      const icon = elems.has("icon") ? `${blockIcon(gitBranchBlock)} ` : "";
      return {
        alwaysVisible: false,
        preamble: [`local _branch; _branch=$(git branch --show-current 2>/dev/null)`],
        condition: `[[ -n "$_branch" ]]`,
        content: `${icon}$_branch`,
      };
    }
    case "exit-code": {
      const exitBlock = getBlockById("exit-code")!;
      return {
        alwaysVisible: false,
        preamble: [],
        condition: `[[ $_last_exit -ne 0 ]]`,
        content: `${blockIcon(exitBlock)}$_last_exit`,
      };
    }
    case "node-version": {
      const nodeBlock = getBlockById("node-version")!;
      return {
        alwaysVisible: false,
        preamble: [`local _node; _node=$(node --version 2>/dev/null | sed 's/v//')`],
        condition: `[[ -n "$_node" ]]`,
        content: `${blockIcon(nodeBlock)} $_node`,
      };
    }
    default:
      return null;
  }
}

// ─── Powertab zone code ───────────────────────────────────────────────────────

function generatePowertabZoneCode(
  zoneConfig: { blocks: Array<{ blockId: string; style: string }> },
  theme: ThemeDefinition,
  separator: string
): string[] {
  const lines: string[] = [`# Requires Nerd Font`, ``];

  for (const inst of zoneConfig.blocks) {
    const block = getBlockById(inst.blockId);
    if (!block) continue;
    const slotHex = resolveSlot(block.themeSlot, theme) ?? "#888888";
    const acHex = autoContrastHex(slotHex);

    // Icon region: block bg + auto-contrast fg
    const bgEsc = bgEscape(slotHex);
    const acFgEsc = fgEscape(acHex);
    const blockFgEsc = fgEscape(slotHex);

    // Find icon from elements
    const iconElem = Object.values(block.elements ?? {}).find((e) => e.role === "icon");
    const iconChar = iconElem?.value ?? "";

    const content = generatePowerlineBlockContent(inst.blockId, inst.style, theme);
    if (!content) continue;

    const seg = [
      `# ${block.name}`,
    ];

    if (!content.alwaysVisible) {
      seg.push(...content.preamble);
      seg.push(`if ${content.condition}; then`);
      seg.push(`  _ps1+="${acFgEsc}${bgEsc} ${iconChar} ${RESET_ESCAPE}"`);
      seg.push(`  _ps1+="${blockFgEsc}${separator}${RESET_ESCAPE}"`);
      seg.push(`  _ps1+="${blockFgEsc} ${content.content} ${RESET_ESCAPE}"`);
      seg.push(`fi`);
    } else {
      seg.push(`_ps1+="${acFgEsc}${bgEsc} ${iconChar} ${RESET_ESCAPE}"`);
      seg.push(`_ps1+="${blockFgEsc}${separator}${RESET_ESCAPE}"`);
      seg.push(`_ps1+="${blockFgEsc} ${content.content} ${RESET_ESCAPE}"`);
    }
    lines.push(...seg, ``);
  }

  return lines;
}

// ─── Zone code generator ──────────────────────────────────────────────────────

function resolveLayout(
  _zoneId: string,
  zoneConfig: { layout?: ZoneLayoutType },
  config: SurfaceConfig
): ZoneLayoutType {
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
  const surface = getSurfaceById(config.surfaceId);
  if (!surface) return "";

  const promptChar = String(config.globalOptions?.["prompt-char"] ?? "❯");
  const multiline = Boolean(config.globalOptions?.["multiline"] ?? false);

  const leftZone = config.zones["left-prompt"];
  const rightZone = config.zones["right-prompt"];
  const contZone = config.zones["continuation-prompt"];

  const leftLayout = resolveLayout("left-prompt", leftZone ?? {}, config);
  const rightLayout = resolveLayout("right-prompt", rightZone ?? {}, config);
  const contLayout = resolveLayout("continuation-prompt", contZone ?? {}, config);

  const hasPowerline = [leftLayout, rightLayout, contLayout].some(
    (l) => l === "powerline" || l === "powertab"
  );
  const hasRight = isZoneEnabled("right-prompt", config) && (rightZone?.blocks.length ?? 0) > 0;
  const hasCont = isZoneEnabled("continuation-prompt", config) && (contZone?.blocks.length ?? 0) > 0;

  // Check which special setups are needed
  let needsExitCapture = false;
  let needsTimerSetup = false;

  const checkBlocks = (zone?: { blocks: Array<{ blockId: string; style: string }> }) => {
    for (const inst of zone?.blocks ?? []) {
      if (inst.blockId === "exit-code") needsExitCapture = true;
      if (inst.blockId === "cmd-duration") needsTimerSetup = true;
    }
  };
  checkBlocks(leftZone);
  checkBlocks(rightZone);
  checkBlocks(contZone);

  const fn: string[] = [];

  // Timer setup (goes before function definition)
  if (needsTimerSetup) {
    fn.push(`_TT_CMD_START=$(date +%s%3N)`);
    fn.push(`trap '_TT_CMD_START=$(date +%s%3N)' DEBUG`);
    fn.push(``);
  }

  fn.push(`_tt_build_prompt() {`);
  if (hasPowerline) fn.push(`  # Requires Nerd Font`);
  if (needsExitCapture) fn.push(`  local _last_exit=$?`);
  if (needsTimerSetup) {
    fn.push(`  local _cmd_end; _cmd_end=$(date +%s%3N)`);
    fn.push(`  local _cmd_ms=$(( _cmd_end - _TT_CMD_START ))`);
  }

  // ── Left prompt ────────────────────────────────────────────────────────────
  if ((leftZone?.blocks.length ?? 0) > 0) {
    fn.push(`  local _ps1=""`);
    fn.push(``);

    if (leftLayout === "powerline") {
      const inner = generatePowerlineZoneCode(
        leftZone!,
        theme,
        "\\ue0b0",
        "\\ue0b0"
      );
      fn.push(...indent(inner));
    } else if (leftLayout === "powertab") {
      const inner = generatePowertabZoneCode(leftZone!, theme, "\\ue0b1");
      fn.push(...indent(inner));
    } else {
      for (const inst of leftZone!.blocks) {
        const block = getBlockById(inst.blockId);
        if (!block) continue;
        const bc = generateBlockCode(inst.blockId, inst.style, leftLayout, theme, false);
        fn.push(`  # ${block.name}`);
        fn.push(...indent(bc.lines));
        fn.push(``);
      }
    }
  }

  // ── Right prompt ────────────────────────────────────────────────────────────
  if (hasRight) {
    fn.push(`  # ── right-prompt (cursor positioning — may be unreliable on resize)`);
    fn.push(`  local _rps1="" _rlen=0`);
    fn.push(``);

    for (const inst of rightZone!.blocks) {
      const block = getBlockById(inst.blockId);
      if (!block) continue;
      const bc = generateBlockCode(inst.blockId, inst.style, rightLayout, theme, true);
      fn.push(`  # ${block.name}`);
      fn.push(...indent(bc.lines));
      fn.push(``);
    }

    fn.push(`  if [[ -n "$_rps1" ]]; then`);
    fn.push(`    printf "\\e7\\e[%dG%s\\e8" "$(( \${COLUMNS:-80} - _rlen + 1 ))" "$_rps1"`);
    fn.push(`  fi`);
    fn.push(``);
  }

  // ── Continuation prompt ────────────────────────────────────────────────────
  if (hasCont) {
    fn.push(`  local _ps2=""`);
    for (const inst of contZone!.blocks) {
      const block = getBlockById(inst.blockId);
      if (!block) continue;
      const bc = generateBlockCode(inst.blockId, inst.style, contLayout, theme, false);
      const patchedLines = bc.lines.map((l) => l.replace(/_ps1\+=/g, "_ps2+="));
      fn.push(...indent(patchedLines));
    }
    fn.push(`  PS2="$_ps2"`);
    fn.push(``);
  }

  // ── Final PS1 assignment ───────────────────────────────────────────────────
  const newline = multiline ? `$'\\n'` : "";
  fn.push(`  PS1="\${_ps1}${newline}${promptChar} "`);
  fn.push(`}`);
  fn.push(``);
  fn.push(`PROMPT_COMMAND+=(_tt_build_prompt)`);

  return fn.join("\n");
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function exportBash(config: SurfaceConfig, theme: ThemeDefinition): CodeSection[] {
  return [
    { label: "Colors", code: generateColorsSection(config, theme) },
    { label: "Prompt", code: generatePromptSection(config, theme) },
  ];
}
