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
import { hexToRgb, resolveSlot } from "../color";
import { blockConnector } from "../blockHelpers";
import { isZoneEnabled } from "../composerContext";

// ─── Escape helpers ───────────────────────────────────────────────────────────

function psColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "";
  return `[char]27 + '[38;2;${rgb[0]};${rgb[1]};${rgb[2]}m'`;
}

function psBgColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "";
  return `[char]27 + '[48;2;${rgb[0]};${rgb[1]};${rgb[2]}m'`;
}

const PS_RESET = `[char]27 + '[0m'`;

function psVarName(slot: string, theme: ThemeDefinition): string {
  let root = slot;
  if (!theme.tokens[`--tt-color-${slot}`]) {
    const dash = slot.lastIndexOf("-");
    if (dash > 0) root = slot.slice(0, dash);
  }
  const pascal = root.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
  return `$TtColor${pascal}`;
}

// ─── Color collection ─────────────────────────────────────────────────────────

function collectColorVars(config: SurfaceConfig, theme: ThemeDefinition): Map<string, string> {
  const vars = new Map<string, string>();
  const hasPl = Object.values(config.zones).some(
    (z) => z.layout === "powerline" || z.layout === "powertab",
  );
  const hasFlow = Object.values(config.zones).some((z) => !z.layout || z.layout === "flow");

  const addSlot = (slot: string) => {
    const hex = resolveSlot(slot, theme);
    if (!hex) return;
    const name = psVarName(slot, theme);
    if (!vars.has(name)) vars.set(name, hex);
    if (hasPl) {
      const bgName = name.replace("$TtColor", "$TtBg");
      if (!vars.has(bgName)) vars.set(bgName, hex);
    }
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
    if (muted) vars.set("$TtMuted", muted);
  }
  const border = theme.tokens["--tt-border-primary"];
  if (border) vars.set("$TtBorder", border);
  return vars;
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

// ─── Generic block walker ─────────────────────────────────────────────────────

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
): string[] {
  const tmpl = block.styles[style] ?? block.styles[block.defaultStyle];
  const tokens = parseTemplate(tmpl);

  const bindings = new Map<string, { binding: TargetCaptureBinding; optional: boolean }>();
  for (const tok of tokens) {
    if (tok.kind !== "elem") continue;
    const elem = block.elements[tok.name];
    if (!elem || !elem.capture || elem.role !== "content") continue;
    const cap = block.captures?.[elem.capture];
    if (!cap) continue;
    const binding = cap.targets["powershell-prompt"];
    if (!binding) continue;
    if (!bindings.has(elem.capture)) {
      bindings.set(elem.capture, { binding, optional: cap.optional ?? false });
    }
  }

  const seenSetup = new Set<string>();
  const setup: string[] = [];
  const requiredBindings = [...bindings.values()].filter((b) => !b.optional);
  const optionalBindings = [...bindings.values()].filter((b) => b.optional);

  for (const { binding } of requiredBindings) {
    for (const line of binding.setup) {
      if (!seenSetup.has(line)) { seenSetup.add(line); setup.push(line); }
    }
  }

  const requiredGuards = requiredBindings.map((b) => b.binding.guard).filter((g) => g !== "$true");
  const optionalGuards = optionalBindings.map((b) => b.binding.guard).filter((g) => g !== "$true");
  const blockGuard =
    requiredGuards.length > 0
      ? requiredGuards.map((g) => `(${g})`).join(" -and ")
      : optionalGuards.length > 0
        ? optionalGuards.map((g) => `(${g})`).join(" -or ")
        : null;

  const innerSetup: string[] = [];
  for (const { binding } of optionalBindings) {
    for (const line of binding.setup) {
      if (!seenSetup.has(line)) { seenSetup.add(line); innerSetup.push(line); }
    }
  }

  const blockColorVar = psVarName(block.themeSlot, theme);
  // Use curly-brace interpolation for safety inside double-quoted strings.
  const colorIns = (varName: string) => `\${${varName.slice(1)}}`; // "$TtColorVcs" → "${TtColorVcs}"

  let content = "";
  let activeColorVar = blockColorVar;
  content += colorIns(blockColorVar);
  for (const tok of tokens) {
    if (tok.kind === "lit") { content += tok.text; continue; }
    const elem = block.elements[tok.name];
    if (!elem) continue;
    if (elem.value !== undefined) { content += elem.value; continue; }
    if (!elem.capture) continue;
    const binding = bindings.get(elem.capture);
    if (!binding) continue;

    const elemColorVar = elem.themeSlot ? psVarName(elem.themeSlot, theme) : blockColorVar;
    // PS interpolation for ref: wrap with $( ) if ref begins with a non-simple expression.
    const ref = binding.binding.ref;
    let piece = ref;
    if (binding.optional && binding.binding.guard !== "$true") {
      // Break out of the outer double-quoted string to avoid nested-quote parser errors.
      piece = `" + $(if (${binding.binding.guard}) { "${ref}" } else { "" }) + "`;
    }
    if (elemColorVar !== activeColorVar) {
      content += colorIns(elemColorVar);
      activeColorVar = elemColorVar;
    }
    content += piece;
  }
  content += "${TtReset}";

  const framed = layout === "brackets"
    ? `\${TtBorder}[\${TtReset}${content}\${TtBorder}]\${TtReset}`
    : content;

  const connector = blockConnector(block);
  const connectorPrefix =
    layout === "flow" && connector
      ? `\${TtMuted}${connector}\${TtReset} `
      : "";

  const appendLine = `${zoneVar} += "${connectorPrefix}${framed} "`;

  if (!blockGuard) return [...setup, ...innerSetup, appendLine];
  return [
    ...setup,
    `if (${blockGuard}) {`,
    ...innerSetup.map((l) => `    ${l}`),
    `    ${appendLine}`,
    `}`,
  ];
}

// ─── Zone helpers ─────────────────────────────────────────────────────────────

function resolveLayout(
  zoneConfig: { layout?: ZoneLayoutType },
  config: SurfaceConfig,
): ZoneLayoutType {
  return zoneConfig.layout ?? getSurfaceById(config.surfaceId)?.defaultLayout ?? "plain";
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
    (l) => l === "powerline" || l === "powertab",
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

  const emitZone = (
    zone: { blocks: Array<{ blockId: string; style: string }> },
    layout: ZoneLayoutType,
    zoneVar: string,
  ) => {
    for (const inst of zone.blocks) {
      const block = getBlockById(inst.blockId);
      if (!block) continue;
      lines.push(`    # ${block.name}`);
      for (const l of emitBlock(block, inst.style, layout, theme, zoneVar)) {
        lines.push(`    ${l}`);
      }
      lines.push(``);
    }
  };

  if (leftZone) emitZone(leftZone, leftLayout, "$prompt");

  if (hasRight) {
    lines.push(`    # ── right-prompt (cursor positioning — may be unreliable on resize)`);
    lines.push(`    $rPrompt = ""`);
    lines.push(`    $rLen = 0`);
    lines.push(``);
    emitZone(rightZone!, rightLayout, "$rPrompt");
    lines.push(`    if ($rPrompt) {`);
    lines.push(`        $cols = $Host.UI.RawUI.WindowSize.Width`);
    lines.push(`        $rLenClean = ($rPrompt -replace '\\x1b[0-9;[]*m','').Length`);
    lines.push(`        $pos = $cols - $rLenClean`);
    lines.push(`        Write-Host -NoNewline "$([char]27)[s$([char]27)[$($pos)G$rPrompt$([char]27)[u"`);
    lines.push(`    }`);
    lines.push(``);
  }

  const newline = multiline ? "`n" : "";
  lines.push(`    return $prompt + "${newline}${promptChar} "`);
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
