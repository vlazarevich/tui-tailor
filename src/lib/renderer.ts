import type {
  BlockDefinition,
  ElementDefinition,
  ResolvedElement,
  RenderSpan,
  ScenarioData,
  ZoneLayout,
} from "./types";
import type { ThemeDefinition } from "./data/themes";
import { autoContrast, resolveSlot } from "./color";
import type { BlockSpans, SelectSpan } from "./compose/ir";
import { arrangeSpans } from "./compose/arrange";

export type { BlockSpans, SelectSpan } from "./compose/ir";
export {
  arrangePlain,
  arrangeFlow,
  arrangeBrackets,
  arrangePowerline,
  arrangePowertab,
  arrangeZone,
} from "./compose/arrange";

// ---------------------------------------------------------------------------
// Stage 1: EMIT — resolve block elements against scenario data
// ---------------------------------------------------------------------------

export function emitElements(block: BlockDefinition, scenario: ScenarioData): Record<string, ResolvedElement> {
  const result: Record<string, ResolvedElement> = {};
  for (const [name, elem] of Object.entries(block.elements)) {
    const text = resolveElementText(block, elem, scenario);
    const themeSlot = elem.themeSlot ?? block.themeSlot;
    result[name] = { name, text, themeSlot, role: elem.role };
  }
  return result;
}

function resolveElementText(
  block: BlockDefinition,
  elem: ElementDefinition,
  scenario: ScenarioData,
): string {
  if (elem.value !== undefined) return elem.value;
  if (!elem.capture) return "";
  const capture = block.captures?.[elem.capture];
  if (!capture) return "";
  const raw = capture.scenario(scenario);
  if (raw === undefined || raw === null || raw === "" || raw === false) return "";
  return String(raw);
}

// ---------------------------------------------------------------------------
// Stage 2: SELECT — apply style template to produce ordered spans
// ---------------------------------------------------------------------------

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
    return bgResolved ? autoContrast(bgResolved) : null;
  }
  if (fg === "muted") return theme.tokens["--tt-text-muted"] ?? null;
  if (fg === "border") return theme.tokens["--tt-border-primary"] ?? null;
  if (fg === "default") return theme.tokens["--tt-surface-terminal"] ?? null;

  return resolveSlot(fg, theme);
}

function resolveBgColor(bg: string | null, theme: ThemeDefinition): string | null {
  if (!bg) return null;
  if (bg === "default") return theme.tokens["--tt-surface-terminal"] ?? null;
  return resolveSlot(bg, theme);
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
    return { blockId: block.id, spans, elements, themeSlot: block.themeSlot, visible };
  });

  const renderSpans = arrangeSpans(blockSpansList, layout);
  return paintSpans(renderSpans, theme);
}
