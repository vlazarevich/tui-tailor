import type { ZoneLayout, PlainConfig, BracketsConfig, PowerlineConfig, PowertabConfig, RenderSpan } from "../types";
import type { BlockSpans, ArrangedZone, BlockBoundary } from "./ir";

function toRender(role: string): RenderSpan["role"] {
  if (role === "content" || role === "icon" || role === "connector") return role;
  return "content";
}

// ─── Plain: content spans + trailing gap, all inside the block's range. ──────
export function arrangePlain(blocks: BlockSpans[], config: PlainConfig): ArrangedZone {
  const spans: RenderSpan[] = [];
  const blockBoundaries: BlockBoundary[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (!block.visible) continue;
    const start = spans.length;
    for (const span of block.spans) {
      if (span.role === "connector") continue;
      spans.push({ text: span.text, fg: span.themeSlot, bg: null, role: toRender(span.role) });
    }
    if (config.gap) spans.push({ text: config.gap, fg: null, bg: null, role: "separator" });
    blockBoundaries.push({ blockIndex: i, blockId: block.blockId, start, end: spans.length });
  }
  return { spans, blockBoundaries };
}

// ─── Flow: leading muted connector, content, trailing space. Self-contained. ─
export function arrangeFlow(blocks: BlockSpans[]): ArrangedZone {
  const spans: RenderSpan[] = [];
  const blockBoundaries: BlockBoundary[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (!block.visible) continue;
    const start = spans.length;

    const connectorElem = Object.values(block.elements).find((e) => e.role === "connector");
    if (connectorElem && connectorElem.text) {
      spans.push({ text: connectorElem.text, fg: "muted", bg: null, role: "connector" });
      spans.push({ text: " ", fg: null, bg: null, role: "separator" });
    }
    for (const span of block.spans) {
      if (span.role === "connector") continue;
      spans.push({ text: span.text, fg: span.themeSlot, bg: null, role: toRender(span.role) });
    }
    spans.push({ text: " ", fg: null, bg: null, role: "separator" });
    blockBoundaries.push({ blockIndex: i, blockId: block.blockId, start, end: spans.length });
  }
  return { spans, blockBoundaries };
}

// ─── Brackets: [content] + trailing gap, self-contained. ─────────────────────
export function arrangeBrackets(blocks: BlockSpans[], config: BracketsConfig): ArrangedZone {
  const spans: RenderSpan[] = [];
  const blockBoundaries: BlockBoundary[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (!block.visible) continue;
    const start = spans.length;
    spans.push({ text: config.open, fg: "border", bg: null, role: "bracket" });
    if (config.padding) {
      spans.push({ text: config.padding, fg: null, bg: null, role: "bracket" });
    }
    for (const span of block.spans) {
      if (span.role === "connector") continue;
      spans.push({ text: span.text, fg: span.themeSlot, bg: null, role: toRender(span.role) });
    }
    if (config.padding) {
      spans.push({ text: config.padding, fg: null, bg: null, role: "bracket" });
    }
    spans.push({ text: config.close, fg: "border", bg: null, role: "bracket" });
    if (config.gap) spans.push({ text: config.gap, fg: null, bg: null, role: "separator" });
    blockBoundaries.push({ blockIndex: i, blockId: block.blockId, start, end: spans.length });
  }
  return { spans, blockBoundaries };
}

// ─── Powerline pill: lead-chevron + padded body + trail-chevron. ─────────────
// Self-contained; no neighbor dependency. Hidden blocks vanish cleanly.
const POWERLINE_LEAD = "";
const POWERLINE_TRAIL = "";

export function arrangePowerline(blocks: BlockSpans[], config: PowerlineConfig): ArrangedZone {
  const spans: RenderSpan[] = [];
  const blockBoundaries: BlockBoundary[] = [];
  const lead = config.lead || POWERLINE_LEAD;
  const trail = config.trail || POWERLINE_TRAIL;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (!block.visible) continue;
    const start = spans.length;

    spans.push({ text: lead, fg: "default", bg: block.themeSlot, role: "separator" });
    spans.push({ text: " ", fg: "auto-contrast", bg: block.themeSlot, role: "separator" });
    for (const span of block.spans) {
      if (span.role === "connector") continue;
      spans.push({ text: span.text, fg: "auto-contrast", bg: block.themeSlot, role: toRender(span.role) });
    }
    spans.push({ text: " ", fg: "auto-contrast", bg: block.themeSlot, role: "separator" });
    spans.push({ text: trail, fg: block.themeSlot, bg: "default", role: "separator" });
    blockBoundaries.push({ blockIndex: i, blockId: block.blockId, start, end: spans.length });
  }
  return { spans, blockBoundaries };
}

// ─── Powertab: icon tab (lead + icon region + trail) + plain content + gap. ──
// Option A: colored icon tab attached to plain content on default bg.
const POWERTAB_LEAD = "";
const POWERTAB_TRAIL = "";

export function arrangePowertab(blocks: BlockSpans[], config: PowertabConfig): ArrangedZone {
  const spans: RenderSpan[] = [];
  const blockBoundaries: BlockBoundary[] = [];
  const lead = config.lead || POWERTAB_LEAD;
  const trail = config.trail || POWERTAB_TRAIL;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (!block.visible) continue;
    const start = spans.length;

    const iconElem = Object.values(block.elements).find((e) => e.role === "icon");
    const iconText = iconElem?.text ?? "";

    // Icon tab (colored background)
    spans.push({ text: lead, fg: block.themeSlot, bg: "default", role: "separator" });
    spans.push({ text: " ", fg: "auto-contrast", bg: block.themeSlot, role: "icon" });
    if (iconText) {
      spans.push({ text: iconText, fg: "auto-contrast", bg: block.themeSlot, role: "icon" });
      spans.push({ text: " ", fg: "auto-contrast", bg: block.themeSlot, role: "icon" });
    }
    spans.push({ text: trail, fg: block.themeSlot, bg: "default", role: "separator" });

    // Content region on default bg. Leading/trailing whitespace comes from template.
    for (const span of block.spans) {
      if (span.role === "icon" || span.role === "connector") continue;
      spans.push({ text: span.text, fg: span.themeSlot, bg: null, role: toRender(span.role) });
    }
    spans.push({ text: " ", fg: null, bg: null, role: "separator" });
    blockBoundaries.push({ blockIndex: i, blockId: block.blockId, start, end: spans.length });
  }
  return { spans, blockBoundaries };
}

export function arrangeZone(blocks: BlockSpans[], layout: ZoneLayout): ArrangedZone {
  switch (layout.type) {
    case "plain":
      return arrangePlain(blocks, layout.config);
    case "flow":
      return arrangeFlow(blocks);
    case "brackets":
      return arrangeBrackets(blocks, layout.config);
    case "powerline":
      return arrangePowerline(blocks, layout.config);
    case "powertab":
      return arrangePowertab(blocks, layout.config);
  }
}

// Preview convenience: only spans needed.
export function arrangeSpans(blocks: BlockSpans[], layout: ZoneLayout): RenderSpan[] {
  return arrangeZone(blocks, layout).spans;
}
