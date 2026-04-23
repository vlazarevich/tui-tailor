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
import type { BlockSpans } from "./compose/ir";
import { arrangeSpans } from "./compose/arrange";
import { selectSpans, computeBlockVisibility } from "./compose/select";

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
