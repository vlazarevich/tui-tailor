import type {
  SurfaceConfig,
  CodeSection,
  ZoneLayoutType,
  ResolvedElement,
  RenderSpan,
  TargetCaptureBinding,
  ZoneLayout,
} from "../types";
import type { ThemeDefinition } from "../data/themes";
import type { BlockSpans } from "../compose/ir";
import { getBlockById } from "../data/blocks";
import { getSurfaceById, LAYOUT_CONFIGS } from "../data/surfaces";
import { hexToRgb, autoContrast, resolveSlot } from "../color";
import { isZoneEnabled } from "../composerContext";
import { arrangeZone } from "../compose/arrange";
import { selectSpans } from "../renderer";

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

function rawFg(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "";
  return `$'\\e[38;2;${rgb[0]};${rgb[1]};${rgb[2]}m'`;
}

function rawBg(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "";
  return `$'\\e[48;2;${rgb[0]};${rgb[1]};${rgb[2]}m'`;
}

const RAW_RESET = "$'\\e[0m'";

// ─── Theme slot resolution ────────────────────────────────────────────────────

function slotRootName(slot: string, theme: ThemeDefinition): string {
  return theme.tokens[`--tt-color-${slot}`]
    ? slot
    : slot.includes("-")
      ? slot.slice(0, slot.lastIndexOf("-"))
      : slot;
}

function slotVarName(slot: string, theme: ThemeDefinition): string {
  return `_TT_${slotRootName(slot, theme).toUpperCase().replace(/-/g, "_")}`;
}

// ─── Color collection ─────────────────────────────────────────────────────────

interface ColorVarInfo { fg: string; bg?: string; acFg?: string }

function configHasLayout(config: SurfaceConfig, types: ZoneLayoutType[]): boolean {
  return Object.values(config.zones).some((z) => types.includes(z.layout ?? "plain" as ZoneLayoutType));
}

function collectColorVars(config: SurfaceConfig, theme: ThemeDefinition): Map<string, ColorVarInfo> {
  const vars = new Map<string, ColorVarInfo>();
  const needsBg = configHasLayout(config, ["powerline", "powertab"]);
  const needsMuted = configHasLayout(config, ["flow"]);
  const needsBorder = configHasLayout(config, ["brackets"]);

  const addSlot = (slot: string) => {
    const hex = resolveSlot(slot, theme);
    if (!hex) return;
    const name = slotVarName(slot, theme);
    if (vars.has(name)) return;
    const info: ColorVarInfo = { fg: hex };
    if (needsBg) { info.bg = hex; info.acFg = autoContrast(hex); }
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

  if (needsMuted) {
    const muted = theme.tokens["--tt-text-muted"];
    if (muted) vars.set("_TT_MUTED", { fg: muted });
  }
  if (needsBorder) {
    const border = theme.tokens["--tt-border-primary"];
    if (border) vars.set("_TT_BORDER", { fg: border });
  }
  return vars;
}

function generateColorsSection(config: SurfaceConfig, theme: ThemeDefinition): string {
  const vars = collectColorVars(config, theme);
  const needsBg = configHasLayout(config, ["powerline", "powertab"]);
  const lines: string[] = ["# Add to ~/.bashrc", ""];
  for (const [name, info] of vars) {
    lines.push(`${name}='${fgEscape(info.fg)}'`);
    if (needsBg && info.bg) {
      lines.push(`${name}_BG='${bgEscape(info.bg)}'`);
      lines.push(`${name}_FG='${fgEscape(info.acFg ?? "#ffffff")}'`);
    }
  }
  if (needsBg) {
    const termHex = theme.tokens["--tt-surface-terminal"];
    if (termHex) {
      lines.push(`_TT_DEFAULT='${fgEscape(termHex)}'`);
      lines.push(`_TT_DEFAULT_BG='${bgEscape(termHex)}'`);
    }
  }
  lines.push(`_TT_RESET='${RESET_ESCAPE}'`);
  return lines.join("\n");
}

// ─── Target abstraction ──────────────────────────────────────────────────────

interface BashTarget {
  fgSlot(slot: string, theme: ThemeDefinition): string;
  fgAuto(bgSlot: string | null, theme: ThemeDefinition): string;
  fgMuted(theme: ThemeDefinition): string;
  fgBorder(theme: ThemeDefinition): string;
  fgDefault(theme: ThemeDefinition): string;
  bgSlot(slot: string, theme: ThemeDefinition): string;
  bgDefault(theme: ThemeDefinition): string;
  reset: string;
}

const LEFT_TARGET: BashTarget = {
  fgSlot: (slot, theme) => `\${${slotVarName(slot, theme)}}`,
  fgAuto: (bgSlot, theme) => {
    if (!bgSlot) return "";
    if (bgSlot === "default") return `\${_TT_DEFAULT}`; // auto-contrast against terminal bg falls back to the terminal-surface fg
    return `\${${slotVarName(bgSlot, theme)}_FG}`;
  },
  fgMuted: () => `\${_TT_MUTED}`,
  fgBorder: () => `\${_TT_BORDER}`,
  fgDefault: () => `\${_TT_DEFAULT}`,
  bgSlot: (slot, theme) => `\${${slotVarName(slot, theme)}_BG}`,
  bgDefault: () => `\${_TT_DEFAULT_BG}`,
  reset: "${_TT_RESET}",
};

function rightTarget(theme: ThemeDefinition): BashTarget {
  return {
    fgSlot: (slot) => rawFg(resolveSlot(slot, theme) ?? "#ffffff"),
    fgAuto: (bgSlot) => {
      if (!bgSlot) return "";
      const bgHex = bgSlot === "default"
        ? (theme.tokens["--tt-surface-terminal"] ?? "#000000")
        : (resolveSlot(bgSlot, theme) ?? "#000000");
      return rawFg(autoContrast(bgHex));
    },
    fgMuted: (t) => rawFg(t.tokens["--tt-text-muted"] ?? "#888888"),
    fgBorder: (t) => rawFg(t.tokens["--tt-border-primary"] ?? "#888888"),
    fgDefault: (t) => rawFg(t.tokens["--tt-surface-terminal"] ?? "#000000"),
    bgSlot: (slot) => rawBg(resolveSlot(slot, theme) ?? "#000000"),
    bgDefault: (t) => rawBg(t.tokens["--tt-surface-terminal"] ?? "#000000"),
    reset: RAW_RESET,
  };
}

// ─── Template parsing ────────────────────────────────────────────────────────

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

// ─── Per-block spec builder ──────────────────────────────────────────────────

export interface ExportWarning {
  blockId: string;
  blockName: string;
  reason: string;
}

interface BashBlockSpec {
  name: string;
  blockId: string;
  blockSpans: BlockSpans;
  setup: string[];
  innerSetup: string[];
  guard: string | null;
  warning: ExportWarning | null;
}

function buildBashBlockSpec(
  inst: { blockId: string; style: string },
): BashBlockSpec | null {
  const block = getBlockById(inst.blockId);
  if (!block) return null;
  const tmpl = block.styles[inst.style] ?? block.styles[block.defaultStyle];
  const tokens = parseTemplate(tmpl);

  type Binding = { binding: TargetCaptureBinding; optional: boolean; captureName: string };
  const bindingsByCapture = new Map<string, Binding>();
  const elemBindings = new Map<string, Binding>();
  let warning: ExportWarning | null = null;

  for (const tok of tokens) {
    if (tok.kind !== "elem") continue;
    const elem = block.elements[tok.name];
    if (!elem || elem.role !== "content" || !elem.capture) continue;
    const cap = block.captures?.[elem.capture];
    if (!cap) continue;
    const binding = cap.targets["bash-ps1"];
    if (!binding) {
      if (!cap.optional) {
        warning = {
          blockId: block.id,
          blockName: block.name,
          reason: `no bash-ps1 binding for required capture '${elem.capture}'`,
        };
        break;
      }
      continue;
    }
    const entry: Binding = { binding, optional: cap.optional ?? false, captureName: elem.capture };
    elemBindings.set(tok.name, entry);
    if (!bindingsByCapture.has(elem.capture)) bindingsByCapture.set(elem.capture, entry);
  }

  if (warning) {
    return {
      name: block.name,
      blockId: block.id,
      blockSpans: { blockId: block.id, spans: [], elements: {}, themeSlot: block.themeSlot, visible: false },
      setup: [], innerSetup: [], guard: null, warning,
    };
  }

  // Build resolved-elements with shell refs as text, then run through shared selectSpans.
  const refFor = (b: Binding): string => {
    if (b.optional && b.binding.guard !== "true") {
      return `$(${b.binding.guard} && echo "${b.binding.ref}")`;
    }
    return b.binding.ref;
  };

  const elements: Record<string, ResolvedElement> = {};
  for (const [name, e] of Object.entries(block.elements)) {
    let text = "";
    if (e.value !== undefined) text = e.value;
    else if (e.capture) {
      const b = elemBindings.get(name) ?? [...bindingsByCapture.values()].find((x) => x.captureName === e.capture);
      if (b) text = refFor(b);
    }
    elements[name] = { name, text, themeSlot: e.themeSlot ?? block.themeSlot, role: e.role };
  }

  const spans = selectSpans(tmpl, elements);

  // Setup + guard.
  const seen = new Set<string>();
  const setup: string[] = [];
  const innerSetup: string[] = [];
  const required = [...bindingsByCapture.values()].filter((b) => !b.optional);
  const optional = [...bindingsByCapture.values()].filter((b) => b.optional);
  for (const b of required) for (const l of b.binding.setup) if (!seen.has(l)) { seen.add(l); setup.push(l); }
  for (const b of optional) for (const l of b.binding.setup) if (!seen.has(l)) { seen.add(l); innerSetup.push(l); }

  const reqG = required.map((b) => b.binding.guard).filter((g) => g !== "true");
  const optG = optional.map((b) => b.binding.guard).filter((g) => g !== "true");
  const guard =
    reqG.length > 0
      ? reqG.map((g) => `{ ${g}; }`).join(" && ")
      : optG.length > 0
        ? optG.map((g) => `{ ${g}; }`).join(" || ")
        : null;

  return {
    name: block.name,
    blockId: block.id,
    blockSpans: { blockId: block.id, spans, elements, themeSlot: block.themeSlot, visible: true },
    setup, innerSetup, guard, warning: null,
  };
}

// ─── Painter ─────────────────────────────────────────────────────────────────

function fgRefFor(span: RenderSpan, target: BashTarget, theme: ThemeDefinition): string {
  if (!span.fg) return "";
  if (span.fg === "auto-contrast") return target.fgAuto(span.bg, theme);
  if (span.fg === "muted") return target.fgMuted(theme);
  if (span.fg === "border") return target.fgBorder(theme);
  if (span.fg === "default") return target.fgDefault(theme);
  return target.fgSlot(span.fg, theme);
}

function bgRefFor(span: RenderSpan, target: BashTarget, theme: ThemeDefinition): string {
  if (!span.bg) return "";
  if (span.bg === "default") return target.bgDefault(theme);
  return target.bgSlot(span.bg, theme);
}

function paintRange(
  spans: RenderSpan[],
  start: number,
  end: number,
  theme: ThemeDefinition,
  target: BashTarget,
): string {
  let out = "";
  let prevFg: string | null = null;
  let prevBg: string | null = null;
  for (let i = start; i < end; i++) {
    const span = spans[i];
    const wantFg = span.fg;
    const wantBg = span.bg;
    if (wantFg !== prevFg || wantBg !== prevBg) {
      if (prevFg !== null || prevBg !== null) out += target.reset;
      if (wantBg) out += bgRefFor(span, target, theme);
      if (wantFg) out += fgRefFor(span, target, theme);
    }
    out += span.text;
    prevFg = wantFg;
    prevBg = wantBg;
  }
  if (prevFg !== null || prevBg !== null) out += target.reset;
  return out;
}

// ─── Zone emission ───────────────────────────────────────────────────────────

function resolveLayout(
  zoneConfig: { layout?: ZoneLayoutType },
  config: SurfaceConfig,
): ZoneLayout {
  const type = zoneConfig.layout ?? getSurfaceById(config.surfaceId)?.defaultLayout ?? "plain";
  return LAYOUT_CONFIGS[type];
}

function emitZone(
  zoneBlocks: Array<{ blockId: string; style: string }>,
  layout: ZoneLayout,
  zoneVar: string,
  theme: ThemeDefinition,
  target: BashTarget,
  warnings: ExportWarning[],
): string[] {
  const specs: BashBlockSpec[] = [];
  for (const inst of zoneBlocks) {
    const spec = buildBashBlockSpec(inst);
    if (!spec) continue;
    if (spec.warning) warnings.push(spec.warning);
    specs.push(spec);
  }

  const blockSpansList = specs.map((s) => s.blockSpans);
  const { spans, blockBoundaries } = arrangeZone(blockSpansList, layout);

  const lines: string[] = [];
  for (const boundary of blockBoundaries) {
    const spec = specs[boundary.blockIndex];
    if (!spec || !spec.blockSpans.visible) continue;

    lines.push(`# ${spec.name}`);
    for (const l of spec.setup) lines.push(l);

    const painted = paintRange(spans, boundary.start, boundary.end, theme, target);
    const appendLine = `${zoneVar}+="${painted}"`;

    if (!spec.guard) {
      for (const l of spec.innerSetup) lines.push(l);
      lines.push(appendLine);
    } else {
      lines.push(`if ${spec.guard}; then`);
      for (const l of spec.innerSetup) lines.push(`  ${l}`);
      lines.push(`  ${appendLine}`);
      lines.push(`fi`);
    }
    lines.push(``);
  }
  return lines;
}

// ─── Prompt section ──────────────────────────────────────────────────────────

function indent(lines: string[], n = 2): string[] {
  const pad = " ".repeat(n);
  return lines.map((l) => (l === "" ? "" : pad + l));
}

function generatePromptSection(
  config: SurfaceConfig,
  theme: ThemeDefinition,
  warnings: ExportWarning[],
): string {
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

  const hasPowerline = [leftLayout.type, rightLayout.type, contLayout.type].some(
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

  if ((leftZone?.blocks.length ?? 0) > 0) {
    fn.push(`  local _ps1=""`);
    fn.push(``);
    fn.push(...indent(emitZone(leftZone!.blocks, leftLayout, "_ps1", theme, LEFT_TARGET, warnings)));
  }

  if (hasRight) {
    fn.push(`  # ── right-prompt (cursor positioning — may be unreliable on resize)`);
    fn.push(`  local _rps1="" _rlen=0`);
    fn.push(``);
    fn.push(...indent(emitZone(rightZone!.blocks, rightLayout, "_rps1", theme, rightTarget(theme), warnings)));
    fn.push(`  if [[ -n "$_rps1" ]]; then`);
    fn.push(`    printf "\\e7\\e[%dG%s\\e8" "$(( \${COLUMNS:-80} - _rlen + 1 ))" "$_rps1"`);
    fn.push(`  fi`);
    fn.push(``);
  }

  if (hasCont) {
    fn.push(`  local _ps2=""`);
    fn.push(...indent(emitZone(contZone!.blocks, contLayout, "_ps2", theme, LEFT_TARGET, warnings)));
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

// ─── Main export ─────────────────────────────────────────────────────────────

export interface BashExportResult {
  sections: CodeSection[];
  warnings: ExportWarning[];
}

export function exportBashDetailed(config: SurfaceConfig, theme: ThemeDefinition): BashExportResult {
  const warnings: ExportWarning[] = [];
  const sections: CodeSection[] = [
    { label: "Colors", code: generateColorsSection(config, theme) },
    { label: "Prompt", code: generatePromptSection(config, theme, warnings) },
  ];
  return { sections, warnings };
}

export function exportBash(config: SurfaceConfig, theme: ThemeDefinition): CodeSection[] {
  return exportBashDetailed(config, theme).sections;
}
