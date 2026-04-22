import type {
  SurfaceConfig,
  CodeSection,
  ZoneLayoutType,
  BlockDefinition,
  TargetCaptureBinding,
} from "../types";
import type { ThemeDefinition } from "../data/themes";
import { getBlockById } from "../data/blocks";
import { getSurfaceById } from "../data/surfaces";
import { hexToRgb, autoContrast, resolveSlot } from "../color";
import { blockIcon, blockConnector } from "../blockHelpers";
import { isZoneEnabled } from "../composerContext";

// ─── Escape helpers ───────────────────────────────────────────────────────────

function fgEscape(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "";
  return `\\[\\e[38;2;${rgb[0]};${rgb[1]};${rgb[2]}m\\]`;
}

function bgEscape(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "";
  return `\\[\\e[48;2;${rgb[0]};${rgb[1]};${rgb[2]}m\\]`;
}

const RESET_ESCAPE = "\\[\\e[0m\\]";

// Raw ANSI-C quoted fg (right-prompt / printf context).
function rawFg(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "";
  return `$'\\e[38;2;${rgb[0]};${rgb[1]};${rgb[2]}m'`;
}

const RAW_RESET = "$'\\e[0m'";

// ─── Theme slot resolution ────────────────────────────────────────────────────

function slotVarName(slot: string, theme: ThemeDefinition): string {
  const root = theme.tokens[`--tt-color-${slot}`]
    ? slot
    : slot.includes("-")
      ? slot.slice(0, slot.lastIndexOf("-"))
      : slot;
  return `_TT_${root.toUpperCase().replace(/-/g, "_")}`;
}

// ─── Color collection ─────────────────────────────────────────────────────────

interface ColorVarInfo { fg: string; bg?: string; acFg?: string }

function collectColorVars(config: SurfaceConfig, theme: ThemeDefinition): Map<string, ColorVarInfo> {
  const vars = new Map<string, ColorVarInfo>();
  const hasPowerline = Object.values(config.zones).some(
    (z) => z.layout === "powerline" || z.layout === "powertab"
  );
  const hasFlow = Object.values(config.zones).some((z) => z.layout === "flow" || !z.layout);

  const addSlot = (slot: string) => {
    const hex = resolveSlot(slot, theme);
    if (!hex) return;
    const name = slotVarName(slot, theme);
    if (vars.has(name)) return;
    const info: ColorVarInfo = { fg: hex };
    if (hasPowerline) { info.bg = hex; info.acFg = autoContrast(hex); }
    vars.set(name, info);
  };

  for (const zone of Object.values(config.zones)) {
    for (const inst of zone.blocks) {
      const block = getBlockById(inst.blockId);
      if (!block) continue;
      addSlot(block.themeSlot);
      for (const elem of Object.values(block.elements)) {
        if (elem.themeSlot) addSlot(elem.themeSlot);
      }
    }
  }

  if (hasFlow) {
    const muted = theme.tokens["--tt-text-muted"];
    if (muted) vars.set("_TT_MUTED", { fg: muted });
  }
  const hasBrackets = Object.values(config.zones).some((z) => z.layout === "brackets");
  if (hasBrackets) {
    const border = theme.tokens["--tt-border-primary"];
    if (border) vars.set("_TT_BORDER", { fg: border });
  }
  return vars;
}

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
      lines.push(`${name}_SF='${fgEscape(info.bg)}'`);
    }
  }
  lines.push(`_TT_RESET='${RESET_ESCAPE}'`);
  return lines.join("\n");
}

// ─── Generic block walker ─────────────────────────────────────────────────────

interface BashTarget {
  slotRef(slot: string, theme: ThemeDefinition): string;
  reset: string;
}

// Left-prompt target: uses shell vars like ${_TT_VCS}, emits PS1-wrapped escapes.
const LEFT_TARGET: BashTarget = {
  slotRef: (slot, theme) => `\${${slotVarName(slot, theme)}}`,
  reset: "${_TT_RESET}",
};

// Right-prompt target: raw ANSI, inlined per-call (no shared vars defined for raw).
function rightTarget(theme: ThemeDefinition): BashTarget {
  return {
    slotRef: (slot) => rawFg(resolveSlot(slot, theme) ?? "#ffffff"),
    reset: RAW_RESET,
  };
}

function parseTemplate(tmpl: string): Array<{ kind: "lit"; text: string } | { kind: "elem"; name: string }> {
  const out: Array<{ kind: "lit"; text: string } | { kind: "elem"; name: string }> = [];
  const re = /\{(\w+)\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tmpl))) {
    if (m.index > last) out.push({ kind: "lit", text: tmpl.slice(last, m.index) });
    out.push({ kind: "elem", name: m[1] });
    last = m.index + m[0].length;
  }
  if (last < tmpl.length) out.push({ kind: "lit", text: tmpl.slice(last) });
  return out;
}

function emitBlock(
  block: BlockDefinition,
  style: string,
  layout: ZoneLayoutType,
  theme: ThemeDefinition,
  zoneVar: string,
  target: BashTarget,
): string[] {
  const tmpl = block.styles[style] ?? block.styles[block.defaultStyle];
  const tokens = parseTemplate(tmpl);

  // Collect capture bindings referenced by the template.
  const bindings = new Map<string, { binding: TargetCaptureBinding; optional: boolean }>();
  for (const tok of tokens) {
    if (tok.kind !== "elem") continue;
    const elem = block.elements[tok.name];
    if (!elem || !elem.capture || elem.role !== "content") continue;
    const cap = block.captures?.[elem.capture];
    if (!cap) continue;
    const binding = cap.targets["bash-ps1"];
    if (!binding) continue;
    if (!bindings.has(elem.capture)) {
      bindings.set(elem.capture, { binding, optional: cap.optional ?? false });
    }
  }

  // Setup lines, deduped — only for captures whose setup will actually run.
  const seenSetup = new Set<string>();
  const setup: string[] = [];
  const requiredBindings = [...bindings.values()].filter((b) => !b.optional);
  const optionalBindings = [...bindings.values()].filter((b) => b.optional);

  // Required setup unconditionally; optional setup goes inside block guard.
  for (const { binding } of requiredBindings) {
    for (const line of binding.setup) {
      if (!seenSetup.has(line)) { seenSetup.add(line); setup.push(line); }
    }
  }

  // Block guard: AND of required guards (ignoring "true"); if none, OR of optional guards.
  const requiredGuards = requiredBindings.map((b) => b.binding.guard).filter((g) => g !== "true");
  const optionalGuards = optionalBindings.map((b) => b.binding.guard).filter((g) => g !== "true");
  const blockGuard =
    requiredGuards.length > 0
      ? requiredGuards.map((g) => `{ ${g}; }`).join(" && ")
      : optionalGuards.length > 0
        ? optionalGuards.map((g) => `{ ${g}; }`).join(" || ")
        : null;

  // Optional-capture setup goes inside the if-block for efficiency.
  const innerSetup: string[] = [];
  for (const { binding } of optionalBindings) {
    for (const line of binding.setup) {
      if (!seenSetup.has(line)) { seenSetup.add(line); innerSetup.push(line); }
    }
  }

  const blockColor = target.slotRef(block.themeSlot, theme);

  // Walk tokens → build content string.
  let content = "";
  let activeColor = blockColor;
  for (const tok of tokens) {
    if (tok.kind === "lit") { content += tok.text; continue; }
    const elem = block.elements[tok.name];
    if (!elem) continue;
    if (elem.value !== undefined) { content += elem.value; continue; }
    if (!elem.capture) continue;
    const entry = bindings.get(elem.capture);
    if (!entry) continue;
    const { binding: b2, optional } = entry;
    const elemColor = elem.themeSlot ? target.slotRef(elem.themeSlot, theme) : blockColor;
    let piece = b2.ref;
    if (optional && b2.guard !== "true") {
      piece = `$(${b2.guard} && echo "${piece}")`;
    }
    if (elemColor !== activeColor) {
      content += elemColor;
      activeColor = elemColor;
    }
    content += piece;
  }

  // Ensure color reset at end; wrap with block color at start.
  const framed = layout === "brackets"
    ? `\${_TT_BORDER}[${target.reset}${blockColor}${content}${target.reset}\${_TT_BORDER}]${target.reset}`
    : `${blockColor}${content}${target.reset}`;

  // Connector prefix for flow layout.
  const connector = blockConnector(block);
  const connectorPrefix =
    layout === "flow" && connector
      ? `\${_TT_MUTED}${connector}${target.reset} `
      : "";

  const appendLine = `${zoneVar}+="${connectorPrefix}${framed} "`;

  if (!blockGuard) return [...setup, ...innerSetup, appendLine];
  return [
    ...setup,
    `if ${blockGuard}; then`,
    ...innerSetup.map((l) => `  ${l}`),
    `  ${appendLine}`,
    `fi`,
  ];
}

// ─── Powerline/powertab (unchanged — phase 3) ─────────────────────────────────

function generatePowerlineBlockContent(
  blockId: string,
  style: string,
): { alwaysVisible: boolean; preamble: string[]; condition: string; content: string } | null {
  const block = getBlockById(blockId);
  if (!block) return null;
  // Use the first content-bound capture's target binding (bash-ps1) as the data source.
  const tmpl = block.styles[style] ?? block.styles[block.defaultStyle];
  const icon = /\{icon\}/.test(tmpl) ? blockIcon(block) : "";
  const iconPart = icon ? `${icon} ` : "";

  const primaryElem = Object.values(block.elements).find((e) => e.role === "content" && e.capture);
  if (!primaryElem || !primaryElem.capture) return null;
  const cap = block.captures?.[primaryElem.capture];
  if (!cap) return null;
  const binding = cap.targets["bash-ps1"];
  if (!binding) return null;

  const alwaysVisible = binding.guard === "true";
  return {
    alwaysVisible,
    preamble: binding.setup,
    condition: binding.guard,
    content: `${iconPart}${binding.ref}`,
  };
}

function generatePowerlineZoneCode(
  zoneConfig: { blocks: Array<{ blockId: string; style: string }>; layout?: ZoneLayoutType },
  theme: ThemeDefinition,
  separator: string,
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

    const inner = generatePowerlineBlockContent(inst.blockId, inst.style);
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
    `unset _segs _bgs _fgs _sfs _n`,
  );
  return lines;
}

function generatePowertabZoneCode(
  zoneConfig: { blocks: Array<{ blockId: string; style: string }> },
  theme: ThemeDefinition,
  separator: string,
): string[] {
  const lines: string[] = [`# Requires Nerd Font`, ``];

  for (const inst of zoneConfig.blocks) {
    const block = getBlockById(inst.blockId);
    if (!block) continue;
    const slotHex = resolveSlot(block.themeSlot, theme) ?? "#888888";
    const bgEsc = bgEscape(slotHex);
    const acFgEsc = fgEscape(autoContrast(slotHex));
    const blockFgEsc = fgEscape(slotHex);

    const iconElem = Object.values(block.elements ?? {}).find((e) => e.role === "icon");
    const iconChar = iconElem?.value ?? "";

    const inner = generatePowerlineBlockContent(inst.blockId, inst.style);
    if (!inner) continue;

    const seg: string[] = [`# ${block.name}`];
    const appendSeg = () => {
      seg.push(`_ps1+="${acFgEsc}${bgEsc} ${iconChar} ${RESET_ESCAPE}"`);
      seg.push(`_ps1+="${blockFgEsc}${separator}${RESET_ESCAPE}"`);
      seg.push(`_ps1+="${blockFgEsc} ${inner.content} ${RESET_ESCAPE}"`);
    };
    if (!inner.alwaysVisible) {
      seg.push(...inner.preamble);
      seg.push(`if ${inner.condition}; then`);
      const before = seg.length;
      appendSeg();
      for (let i = before; i < seg.length; i++) seg[i] = "  " + seg[i];
      seg.push(`fi`);
    } else {
      appendSeg();
    }
    lines.push(...seg, ``);
  }
  return lines;
}

// ─── Zone code ────────────────────────────────────────────────────────────────

function resolveLayout(
  zoneConfig: { layout?: ZoneLayoutType },
  config: SurfaceConfig,
): ZoneLayoutType {
  return zoneConfig.layout ?? getSurfaceById(config.surfaceId)?.defaultLayout ?? "plain";
}

function indent(lines: string[], n = 2): string[] {
  const pad = " ".repeat(n);
  return lines.map((l) => (l === "" ? "" : pad + l));
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

  const leftLayout = resolveLayout(leftZone ?? {}, config);
  const rightLayout = resolveLayout(rightZone ?? {}, config);
  const contLayout = resolveLayout(contZone ?? {}, config);

  const hasPowerline = [leftLayout, rightLayout, contLayout].some(
    (l) => l === "powerline" || l === "powertab",
  );
  const hasRight = isZoneEnabled("right-prompt", config) && (rightZone?.blocks.length ?? 0) > 0;
  const hasCont = isZoneEnabled("continuation-prompt", config) && (contZone?.blocks.length ?? 0) > 0;

  let needsExitCapture = false;
  let needsTimerSetup = false;
  const scan = (zone?: { blocks: Array<{ blockId: string; style: string }> }) => {
    for (const inst of zone?.blocks ?? []) {
      if (inst.blockId === "exit-code") needsExitCapture = true;
      if (inst.blockId === "cmd-duration") needsTimerSetup = true;
    }
  };
  scan(leftZone); scan(rightZone); scan(contZone);

  const fn: string[] = [];

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

  const emitZoneBlocks = (
    zone: { blocks: Array<{ blockId: string; style: string }> },
    layout: ZoneLayoutType,
    zoneVar: string,
    target: BashTarget,
  ) => {
    for (const inst of zone.blocks) {
      const block = getBlockById(inst.blockId);
      if (!block) continue;
      fn.push(`  # ${block.name}`);
      fn.push(...indent(emitBlock(block, inst.style, layout, theme, zoneVar, target)));
      fn.push(``);
    }
  };

  // Left prompt
  if ((leftZone?.blocks.length ?? 0) > 0) {
    fn.push(`  local _ps1=""`);
    fn.push(``);
    if (leftLayout === "powerline") {
      fn.push(...indent(generatePowerlineZoneCode(leftZone!, theme, "\\ue0b0")));
    } else if (leftLayout === "powertab") {
      fn.push(...indent(generatePowertabZoneCode(leftZone!, theme, "\\ue0b1")));
    } else {
      emitZoneBlocks(leftZone!, leftLayout, "_ps1", LEFT_TARGET);
    }
  }

  // Right prompt
  if (hasRight) {
    fn.push(`  # ── right-prompt (cursor positioning — may be unreliable on resize)`);
    fn.push(`  local _rps1="" _rlen=0`);
    fn.push(``);
    const rTarget = rightTarget(theme);
    emitZoneBlocks(rightZone!, rightLayout, "_rps1", rTarget);
    fn.push(`  if [[ -n "$_rps1" ]]; then`);
    fn.push(`    printf "\\e7\\e[%dG%s\\e8" "$(( \${COLUMNS:-80} - _rlen + 1 ))" "$_rps1"`);
    fn.push(`  fi`);
    fn.push(``);
  }

  // Continuation prompt
  if (hasCont) {
    fn.push(`  local _ps2=""`);
    emitZoneBlocks(contZone!, contLayout, "_ps2", LEFT_TARGET);
    fn.push(`  PS2="$_ps2"`);
    fn.push(``);
  }

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
