import type {
  BlockDefinition,
  ElementDefinition,
  ResolvedElement,
  RenderSpan,
  ScenarioData,
  ZoneLayout,
  PlainConfig,
  BracketsConfig,
  PowerlineConfig,
  PowertabConfig,
} from "./types";
import type { ThemeDefinition } from "./themes";

// ---------------------------------------------------------------------------
// Stage 1: EMIT — resolve block elements against scenario data
// ---------------------------------------------------------------------------

export function emitElements(block: BlockDefinition, scenario: ScenarioData): Record<string, ResolvedElement> {
  const result: Record<string, ResolvedElement> = {};

  for (const [name, elem] of Object.entries(block.elements)) {
    const text = resolveElementText(elem, scenario);
    const themeSlot = elem.themeSlot ?? block.themeSlot;
    result[name] = { name, text, themeSlot, role: elem.role };
  }

  return result;
}

function resolveElementText(elem: ElementDefinition, scenario: ScenarioData): string {
  // Static value — always use as-is
  if (elem.value !== undefined) {
    return elem.value;
  }

  // Source-based resolution
  if (!elem.source) return "";

  const raw = (scenario as Record<string, unknown>)[elem.source];

  // No format string — just stringify the source value
  if (!elem.format) {
    if (raw === undefined || raw === null || raw === "") return "";
    return String(raw);
  }

  // Flag format: format string with no {} placeholder
  // Show the format text if source is strictly true, empty otherwise
  if (!elem.format.includes("{}")) {
    return raw === true ? elem.format : "";
  }

  // Template format: replace {} with source value
  if (raw === undefined || raw === null || raw === "" || raw === 0) return "";
  return elem.format.replace("{}", String(raw));
}

// ---------------------------------------------------------------------------
// Stage 2: SELECT — apply style template to produce ordered spans
// ---------------------------------------------------------------------------

export interface SelectSpan {
  text: string;
  themeSlot: string | null;
  role: "content" | "icon" | "connector" | "literal";
}

export function selectSpans(styleTemplate: string, elements: Record<string, ResolvedElement>): SelectSpan[] {
  const spans: SelectSpan[] = [];
  const tokenPattern = /\{(\w+)\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(styleTemplate)) !== null) {
    // Literal text before this token
    if (match.index > lastIndex) {
      spans.push({ text: styleTemplate.slice(lastIndex, match.index), themeSlot: null, role: "literal" });
    }

    const elemName = match[1];
    const elem = elements[elemName];
    if (elem && elem.text !== "") {
      spans.push({ text: elem.text, themeSlot: elem.themeSlot, role: elem.role });
    }

    lastIndex = match.index + match[0].length;
  }

  // Trailing literal
  if (lastIndex < styleTemplate.length) {
    spans.push({ text: styleTemplate.slice(lastIndex), themeSlot: null, role: "literal" });
  }

  // Collapse adjacent spaces caused by empty elements
  return collapseSpaces(spans);
}

function collapseSpaces(spans: SelectSpan[]): SelectSpan[] {
  const result: SelectSpan[] = [];
  for (const span of spans) {
    if (span.role === "literal" && span.text.trim() === "") {
      // This is a whitespace-only literal — check if it's between two non-empty spans
      if (result.length > 0) {
        result.push(span);
      }
      continue;
    }
    result.push(span);
  }

  // Remove trailing whitespace-only literals
  while (
    result.length > 0 &&
    result[result.length - 1].role === "literal" &&
    result[result.length - 1].text.trim() === ""
  ) {
    result.pop();
  }
  // Remove leading whitespace-only literals
  while (result.length > 0 && result[0].role === "literal" && result[0].text.trim() === "") {
    result.shift();
  }

  // Collapse consecutive whitespace-only literals
  const collapsed: SelectSpan[] = [];
  for (let i = 0; i < result.length; i++) {
    const span = result[i];
    if (span.role === "literal" && span.text.trim() === "") {
      // Check if next non-literal span exists
      const next = result[i + 1];
      if (!next) continue;
      if (next.role === "literal" && next.text.trim() === "") continue;
    }
    collapsed.push(span);
  }

  return collapsed;
}

export function computeBlockVisibility(elements: Record<string, ResolvedElement>): boolean {
  // Block is visible when at least one source-based element has non-empty text
  // Static-value elements (icons, connectors) don't count
  for (const elem of Object.values(elements)) {
    if (elem.role === "icon" || elem.role === "connector") continue;
    if (elem.text !== "") return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Stage 3: ARRANGE — zone layout combines block spans into render spans
// ---------------------------------------------------------------------------

export interface BlockSpans {
  spans: SelectSpan[];
  elements: Record<string, ResolvedElement>;
  themeSlot: string;
  visible: boolean;
}

export function arrangePlain(blockSpansList: BlockSpans[], config: PlainConfig): RenderSpan[] {
  const result: RenderSpan[] = [];
  let first = true;

  for (const block of blockSpansList) {
    if (!block.visible) continue;
    if (!first && config.gap) {
      result.push({ text: config.gap, fg: null, bg: null, role: "separator" });
    }
    for (const span of block.spans) {
      if (span.role === "connector") continue; // plain layout ignores connectors
      result.push({ text: span.text, fg: span.themeSlot, bg: null, role: spanRoleToRenderRole(span.role) });
    }
    first = false;
  }

  return result;
}

export function arrangeFlow(blockSpansList: BlockSpans[]): RenderSpan[] {
  const result: RenderSpan[] = [];

  for (const block of blockSpansList) {
    if (!block.visible) continue;

    // Find connector from resolved elements (not from selected spans, since templates don't include {connector})
    const connectorElem = Object.values(block.elements).find((e) => e.role === "connector");
    if (connectorElem && connectorElem.text) {
      result.push({ text: connectorElem.text, fg: "muted", bg: null, role: "connector" });
      result.push({ text: " ", fg: null, bg: null, role: "separator" });
    }

    for (const span of block.spans) {
      if (span.role === "connector") continue;
      result.push({ text: span.text, fg: span.themeSlot, bg: null, role: spanRoleToRenderRole(span.role) });
    }
    result.push({ text: " ", fg: null, bg: null, role: "separator" });
  }

  // Remove trailing separator
  if (result.length > 0 && result[result.length - 1].role === "separator") {
    result.pop();
  }

  return result;
}

export function arrangeBrackets(blockSpansList: BlockSpans[], config: BracketsConfig): RenderSpan[] {
  const result: RenderSpan[] = [];
  let first = true;

  for (const block of blockSpansList) {
    if (!block.visible) continue;
    if (!first && config.gap) {
      result.push({ text: config.gap, fg: null, bg: null, role: "separator" });
    }
    result.push({ text: config.open, fg: "border", bg: null, role: "bracket" });
    if (config.padding) {
      result.push({ text: config.padding, fg: null, bg: null, role: "bracket" });
    }
    for (const span of block.spans) {
      if (span.role === "connector") continue; // brackets layout ignores connectors
      result.push({ text: span.text, fg: span.themeSlot, bg: null, role: spanRoleToRenderRole(span.role) });
    }
    if (config.padding) {
      result.push({ text: config.padding, fg: null, bg: null, role: "bracket" });
    }
    result.push({ text: config.close, fg: "border", bg: null, role: "bracket" });
    first = false;
  }

  return result;
}

export function arrangePowerline(blockSpansList: BlockSpans[], config: PowerlineConfig): RenderSpan[] {
  const result: RenderSpan[] = [];
  const visible = blockSpansList.filter((b) => b.visible);

  for (let i = 0; i < visible.length; i++) {
    const block = visible[i];
    const nextBlock = visible[i + 1];

    // Pad content with spaces
    result.push({ text: " ", fg: "auto-contrast", bg: block.themeSlot, role: "separator" });
    for (const span of block.spans) {
      if (span.role === "connector") continue;
      result.push({ text: span.text, fg: "auto-contrast", bg: block.themeSlot, role: spanRoleToRenderRole(span.role) });
    }
    result.push({ text: " ", fg: "auto-contrast", bg: block.themeSlot, role: "separator" });

    // Separator or terminator glyph
    if (nextBlock) {
      result.push({ text: config.separator, fg: block.themeSlot, bg: nextBlock.themeSlot, role: "separator" });
    } else {
      result.push({ text: config.terminator, fg: block.themeSlot, bg: "default", role: "separator" });
    }
  }

  return result;
}

export function arrangePowertab(blockSpansList: BlockSpans[], config: PowertabConfig): RenderSpan[] {
  const result: RenderSpan[] = [];
  const visible = blockSpansList.filter((b) => b.visible);

  for (let i = 0; i < visible.length; i++) {
    const block = visible[i];

    // Icon region (colored bg) — pull from resolved elements, not selected spans
    const iconElem = Object.values(block.elements).find((e) => e.role === "icon");
    if (iconElem && iconElem.text) {
      result.push({ text: " ", fg: "auto-contrast", bg: block.themeSlot, role: "icon" });
      result.push({ text: iconElem.text, fg: "auto-contrast", bg: block.themeSlot, role: "icon" });
      result.push({ text: " ", fg: "auto-contrast", bg: block.themeSlot, role: "icon" });
    } else {
      // Fallback: empty tab region
      result.push({ text: " ", fg: "auto-contrast", bg: block.themeSlot, role: "icon" });
    }

    // Separator from icon region to content region
    result.push({ text: config.separator, fg: block.themeSlot, bg: "default", role: "separator" });

    // Content region (default bg, per-element fg)
    result.push({ text: " ", fg: null, bg: "default", role: "separator" });
    for (const span of block.spans) {
      if (span.role === "icon" || span.role === "connector") continue;
      result.push({ text: span.text, fg: span.themeSlot, bg: "default", role: spanRoleToRenderRole(span.role) });
    }

    // Gap or terminator
    if (i < visible.length - 1) {
      result.push({ text: " ", fg: null, bg: "default", role: "separator" });
    } else {
      result.push({ text: " ", fg: null, bg: "default", role: "separator" });
    }
  }

  return result;
}

export function arrangeZone(blockSpansList: BlockSpans[], layout: ZoneLayout): RenderSpan[] {
  switch (layout.type) {
    case "plain":
      return arrangePlain(blockSpansList, layout.config);
    case "flow":
      return arrangeFlow(blockSpansList);
    case "brackets":
      return arrangeBrackets(blockSpansList, layout.config);
    case "powerline":
      return arrangePowerline(blockSpansList, layout.config);
    case "powertab":
      return arrangePowertab(blockSpansList, layout.config);
  }
}

function spanRoleToRenderRole(role: string): RenderSpan["role"] {
  if (role === "content" || role === "icon" || role === "connector") return role;
  return "content";
}

// ---------------------------------------------------------------------------
// Stage 4: PAINT — resolve semantic colors to concrete CSS values
// ---------------------------------------------------------------------------

export interface PaintedSpan {
  text: string;
  fg: string | null;
  bg: string | null;
}

export function paintSpans(spans: RenderSpan[], theme: ThemeDefinition): PaintedSpan[] {
  return spans.map((span) => ({
    text: span.text,
    fg: resolveColor(span.fg, span.bg, theme),
    bg: resolveBgColor(span.bg, theme),
  }));
}

function resolveColor(fg: string | null, bg: string | null, theme: ThemeDefinition): string | null {
  if (!fg) return null;
  if (fg === "auto-contrast") {
    const bgResolved = resolveBgColor(bg, theme);
    return bgResolved ? computeAutoContrast(bgResolved) : null;
  }
  if (fg === "muted") return theme.tokens["--tt-text-muted"] ?? null;
  if (fg === "border") return theme.tokens["--tt-border-primary"] ?? null;

  return resolveSlotColor(fg, theme);
}

function resolveBgColor(bg: string | null, theme: ThemeDefinition): string | null {
  if (!bg) return null;
  if (bg === "default") return theme.tokens["--tt-surface-terminal"] ?? null;
  return resolveSlotColor(bg, theme);
}

function resolveSlotColor(slot: string, theme: ThemeDefinition): string | null {
  // Try exact slot
  const direct = theme.tokens[`--tt-color-${slot}`];
  if (direct) return direct;

  // Sub-slot fallback: vcs-ahead → vcs
  const dashIndex = slot.lastIndexOf("-");
  if (dashIndex > 0) {
    const parent = slot.slice(0, dashIndex);
    const parentColor = theme.tokens[`--tt-color-${parent}`];
    if (parentColor) return parentColor;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Auto-contrast: WCAG AA compliance (4.5:1 minimum)
// ---------------------------------------------------------------------------

function computeAutoContrast(bgHex: string): string {
  const bg = hexToRgb(bgHex);
  if (!bg) return "#000000";

  const bgLum = relativeLuminance(bg);
  // Use white or black text depending on contrast
  const whiteLum = 1.0;
  const blackLum = 0.0;

  const contrastWithWhite = (whiteLum + 0.05) / (bgLum + 0.05);
  const contrastWithBlack = (bgLum + 0.05) / (blackLum + 0.05);

  return contrastWithWhite >= contrastWithBlack ? "#ffffff" : "#000000";
}

function hexToRgb(hex: string): [number, number, number] | null {
  const match = hex.match(/^#([0-9a-f]{6})$/i);
  if (!match) return null;
  const n = parseInt(match[1], 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4),
  );
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// ---------------------------------------------------------------------------
// Full pipeline: convenience function
// ---------------------------------------------------------------------------

export function renderZone(
  blocks: Array<{ block: BlockDefinition; style: string }>,
  scenario: ScenarioData,
  layout: ZoneLayout,
  theme: ThemeDefinition,
): PaintedSpan[] {
  const blockSpansList: BlockSpans[] = blocks.map(({ block, style }) => {
    const elements = emitElements(block, scenario);
    const template = block.styles[style] ?? block.styles[block.defaultStyle];
    const spans = selectSpans(template, elements);
    const visible = computeBlockVisibility(elements);
    return { spans, elements, themeSlot: block.themeSlot, visible };
  });

  const renderSpans = arrangeZone(blockSpansList, layout);
  return paintSpans(renderSpans, theme);
}
