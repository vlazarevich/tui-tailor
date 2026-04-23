import type {
  SurfaceConfig,
  CodeSection,
  ZoneLayoutType,
  ResolvedElement,
  RenderSpan,
  TargetCaptureBinding,
  ZoneLayout,
  ZoneDefinition,
  ZoneTargetBinding,
  ZoneConfig,
} from "../types";
import type { ThemeDefinition } from "../data/themes";
import type { BlockSpans } from "../compose/ir";
import { getBlockById } from "../data/blocks";
import { getSurfaceById, LAYOUT_CONFIGS } from "../data/surfaces";
import { hexToRgb, autoContrast, resolveSlot } from "../color";
import { isZoneEnabled } from "../composerContext";
import { arrangeZone } from "../compose/arrange";
import { selectSpans } from "../compose/select";
import type { ExportWarning } from "./bash";

// ─── Escape helpers ───────────────────────────────────────────────────────────

function psFg(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "";
  return `[char]27 + '[38;2;${rgb[0]};${rgb[1]};${rgb[2]}m'`;
}

function psBg(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "";
  return `[char]27 + '[48;2;${rgb[0]};${rgb[1]};${rgb[2]}m'`;
}

const PS_RESET_DEF = `[char]27 + '[0m'`;

// ─── Theme slot resolution ────────────────────────────────────────────────────

function slotRootName(slot: string, theme: ThemeDefinition): string {
  return theme.tokens[`--tt-color-${slot}`]
    ? slot
    : slot.includes("-")
      ? slot.slice(0, slot.lastIndexOf("-"))
      : slot;
}

function pascal(s: string): string {
  return s.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
}

function slotFgVar(slot: string, theme: ThemeDefinition): string {
  return `$TtColor${pascal(slotRootName(slot, theme))}`;
}
function slotBgVar(slot: string, theme: ThemeDefinition): string {
  return `$TtBg${pascal(slotRootName(slot, theme))}`;
}
function slotAcFgVar(slot: string, theme: ThemeDefinition): string {
  return `$TtFg${pascal(slotRootName(slot, theme))}`;
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
    const name = slotFgVar(slot, theme);
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
    if (muted) vars.set("$TtMuted", { fg: muted });
  }
  if (needsBorder) {
    const border = theme.tokens["--tt-border-primary"];
    if (border) vars.set("$TtBorder", { fg: border });
  }
  return vars;
}

function generateColorsSection(config: SurfaceConfig, theme: ThemeDefinition): string {
  const vars = collectColorVars(config, theme);
  const needsBg = configHasLayout(config, ["powerline", "powertab"]);
  const lines: string[] = ["# Add to $PROFILE", ""];
  for (const [name, info] of vars) {
    lines.push(`${name} = ${psFg(info.fg)}`);
    if (needsBg && info.bg) {
      const bgName = name.replace("$TtColor", "$TtBg");
      const acName = name.replace("$TtColor", "$TtFg");
      lines.push(`${bgName} = ${psBg(info.bg)}`);
      lines.push(`${acName} = ${psFg(info.acFg ?? "#ffffff")}`);
    }
  }
  if (needsBg) {
    const termHex = theme.tokens["--tt-surface-terminal"];
    if (termHex) {
      lines.push(`$TtDefault = ${psFg(termHex)}`);
      lines.push(`$TtDefaultBg = ${psBg(termHex)}`);
    }
  }
  lines.push(`$TtReset = ${PS_RESET_DEF}`);
  return lines.join("\n");
}

// ─── Target abstraction ──────────────────────────────────────────────────────

interface PSTarget {
  fgSlot(slot: string, theme: ThemeDefinition): string;
  fgAuto(bgSlot: string | null, theme: ThemeDefinition): string;
  fgMuted(theme: ThemeDefinition): string;
  fgBorder(theme: ThemeDefinition): string;
  fgDefault(theme: ThemeDefinition): string;
  bgSlot(slot: string, theme: ThemeDefinition): string;
  bgDefault(theme: ThemeDefinition): string;
  reset: string;
}

// Uses curly-brace interpolation `${Name}` for safety inside double-quoted strings.
const PS_TARGET: PSTarget = {
  fgSlot: (slot, theme) => `\${${slotFgVar(slot, theme).slice(1)}}`,
  fgAuto: (bgSlot, theme) => {
    if (!bgSlot) return "";
    if (bgSlot === "default") return `\${TtDefault}`;
    return `\${${slotAcFgVar(bgSlot, theme).slice(1)}}`;
  },
  fgMuted: () => `\${TtMuted}`,
  fgBorder: () => `\${TtBorder}`,
  fgDefault: () => `\${TtDefault}`,
  bgSlot: (slot, theme) => `\${${slotBgVar(slot, theme).slice(1)}}`,
  bgDefault: () => `\${TtDefaultBg}`,
  reset: `\${TtReset}`,
};

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

interface PSBlockSpec {
  name: string;
  blockId: string;
  blockSpans: BlockSpans;
  setup: string[];
  innerSetup: string[];
  guard: string | null;
  warning: ExportWarning | null;
}

function buildPSBlockSpec(
  inst: { blockId: string; style: string },
): PSBlockSpec | null {
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
    const binding = cap.targets["powershell-prompt"];
    if (!binding) {
      if (!cap.optional) {
        warning = {
          kind: "block",
          blockId: block.id,
          blockName: block.name,
          reason: `no powershell-prompt binding for required capture '${elem.capture}'`,
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
      name: block.name, blockId: block.id,
      blockSpans: { blockId: block.id, spans: [], elements: {}, themeSlot: block.themeSlot, visible: false },
      setup: [], innerSetup: [], guard: null, warning,
    };
  }

  // Optional inline gate breaks out of the enclosing double-quoted string.
  const refFor = (b: Binding): string => {
    if (b.optional && b.binding.guard !== "$true") {
      return `" + $(if (${b.binding.guard}) { "${b.binding.ref}" } else { "" }) + "`;
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

  const seen = new Set<string>();
  const setup: string[] = [];
  const innerSetup: string[] = [];
  const required = [...bindingsByCapture.values()].filter((b) => !b.optional);
  const optional = [...bindingsByCapture.values()].filter((b) => b.optional);
  for (const b of required) for (const l of b.binding.setup) if (!seen.has(l)) { seen.add(l); setup.push(l); }
  for (const b of optional) for (const l of b.binding.setup) if (!seen.has(l)) { seen.add(l); innerSetup.push(l); }

  const reqG = required.map((b) => b.binding.guard).filter((g) => g !== "$true");
  const optG = optional.map((b) => b.binding.guard).filter((g) => g !== "$true");
  const guard =
    reqG.length > 0
      ? reqG.map((g) => `(${g})`).join(" -and ")
      : optG.length > 0
        ? optG.map((g) => `(${g})`).join(" -or ")
        : null;

  return {
    name: block.name, blockId: block.id,
    blockSpans: { blockId: block.id, spans, elements, themeSlot: block.themeSlot, visible: true },
    setup, innerSetup, guard, warning: null,
  };
}

// ─── Painter ─────────────────────────────────────────────────────────────────

function fgRefFor(span: RenderSpan, target: PSTarget, theme: ThemeDefinition): string {
  if (!span.fg) return "";
  if (span.fg === "auto-contrast") return target.fgAuto(span.bg, theme);
  if (span.fg === "muted") return target.fgMuted(theme);
  if (span.fg === "border") return target.fgBorder(theme);
  if (span.fg === "default") return target.fgDefault(theme);
  return target.fgSlot(span.fg, theme);
}

function bgRefFor(span: RenderSpan, target: PSTarget, theme: ThemeDefinition): string {
  if (!span.bg) return "";
  if (span.bg === "default") return target.bgDefault(theme);
  return target.bgSlot(span.bg, theme);
}

function paintRange(
  spans: RenderSpan[],
  start: number,
  end: number,
  theme: ThemeDefinition,
  target: PSTarget,
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
  target: PSTarget,
  warnings: ExportWarning[],
): string[] {
  const specs: PSBlockSpec[] = [];
  for (const inst of zoneBlocks) {
    const spec = buildPSBlockSpec(inst);
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
    const appendLine = `${zoneVar} += "${painted}"`;

    if (!spec.guard) {
      for (const l of spec.innerSetup) lines.push(l);
      lines.push(appendLine);
    } else {
      lines.push(`if (${spec.guard}) {`);
      for (const l of spec.innerSetup) lines.push(`    ${l}`);
      lines.push(`    ${appendLine}`);
      lines.push(`}`);
    }
    lines.push(``);
  }
  return lines;
}

// ─── Prompt section ──────────────────────────────────────────────────────────

function indent(lines: string[], n = 4): string[] {
  const pad = " ".repeat(n);
  return lines.map((l) => (l === "" ? "" : pad + l));
}

// ─── Slot handlers ───────────────────────────────────────────────────────────

interface PSSlotContext {
  binding: ZoneTargetBinding;
  zoneDef: ZoneDefinition;
  zoneConfig: ZoneConfig | undefined;
  layout: ZoneLayout;
  theme: ThemeDefinition;
  config: SurfaceConfig;
  warnings: ExportWarning[];
}

type PSSlotHandler = (ctx: PSSlotContext) => string[];

const PS_SLOTS: Record<string, PSSlotHandler> = {
  "prompt-body": ({ zoneDef, zoneConfig, layout, theme, config, warnings }) => {
    const blocks = zoneConfig?.blocks ?? [];
    if (zoneDef.optional && !isZoneEnabled(zoneDef.id, config)) return [];
    if (blocks.length === 0) return [];
    return indent(emitZone(blocks, layout, "$prompt", theme, PS_TARGET, warnings));
  },
  rprompt: ({ zoneDef, zoneConfig, layout, theme, config, warnings }) => {
    if (!isZoneEnabled(zoneDef.id, config) || (zoneConfig?.blocks.length ?? 0) === 0) return [];
    return [
      `    # ── right-prompt (cursor positioning — may be unreliable on resize)`,
      `    $rPrompt = ""`,
      ``,
      ...indent(emitZone(zoneConfig!.blocks, layout, "$rPrompt", theme, PS_TARGET, warnings)),
      `    if ($rPrompt) {`,
      `        $cols = $Host.UI.RawUI.WindowSize.Width`,
      `        $rLenClean = ($rPrompt -replace '\\x1b\\[[0-9;]*m','').Length`,
      `        $pos = $cols - $rLenClean`,
      `        Write-Host -NoNewline "$([char]27)[s$([char]27)[$($pos)G$rPrompt$([char]27)[u"`,
      `    }`,
      ``,
    ];
  },
  continuation: () => [],
};

function generatePromptSection(
  config: SurfaceConfig,
  theme: ThemeDefinition,
  warnings: ExportWarning[],
): string {
  const surface = getSurfaceById(config.surfaceId);
  if (!surface) return "";

  const promptChar = String(config.globalOptions?.["prompt-char"] ?? "❯");
  const multiline = Boolean(config.globalOptions?.["multiline"] ?? false);

  let needsExitCapture = false;
  let needsTimerSetup = false;
  for (const zone of surface.zones) {
    for (const inst of config.zones[zone.id]?.blocks ?? []) {
      if (inst.blockId === "exit-code") needsExitCapture = true;
      if (inst.blockId === "cmd-duration") needsTimerSetup = true;
    }
  }

  const hasPowerline = surface.zones.some((zone) => {
    const zc = config.zones[zone.id];
    return (resolveLayout(zc ?? {}, config).type === "powerline" || resolveLayout(zc ?? {}, config).type === "powertab");
  });

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

  for (const zone of surface.zones) {
    const binding = zone.targetBindings["powershell-prompt"];
    if (!binding) continue;
    const handler = PS_SLOTS[binding.slot];
    if (!handler) {
      const zoneConfig = config.zones[zone.id];
      if ((zoneConfig?.blocks.length ?? 0) > 0 && isZoneEnabled(zone.id, config)) {
        warnings.push({ kind: "zone-slot", zoneId: zone.id, zoneName: zone.name, slot: binding.slot });
      }
      continue;
    }
    const zoneConfig = config.zones[zone.id];
    const layout = resolveLayout(zoneConfig ?? {}, config);
    lines.push(...handler({ binding, zoneDef: zone, zoneConfig, layout, theme, config, warnings }));
  }

  const newline = multiline ? "`n" : "";
  lines.push(`    return $prompt + "${newline}${promptChar} "`);
  lines.push(`}`);

  return lines.join("\n");
}

// ─── Main export ─────────────────────────────────────────────────────────────

export interface PowerShellExportResult {
  sections: CodeSection[];
  warnings: ExportWarning[];
}

export function exportPowerShellDetailed(
  config: SurfaceConfig,
  theme: ThemeDefinition,
): PowerShellExportResult {
  const warnings: ExportWarning[] = [];
  const sections: CodeSection[] = [
    { label: "Colors", code: generateColorsSection(config, theme) },
    { label: "Prompt", code: generatePromptSection(config, theme, warnings) },
  ];
  return { sections, warnings };
}

export function exportPowerShell(config: SurfaceConfig, theme: ThemeDefinition): CodeSection[] {
  return exportPowerShellDetailed(config, theme).sections;
}
