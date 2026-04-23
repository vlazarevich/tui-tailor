import type { ResolvedElement } from "../types";
import type { SelectSpan } from "./ir";

export function selectSpans(styleTemplate: string, elements: Record<string, ResolvedElement>): SelectSpan[] {
  const spans: SelectSpan[] = [];
  const tokenPattern = /\{(\w+)\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(styleTemplate)) !== null) {
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

  if (lastIndex < styleTemplate.length) {
    spans.push({ text: styleTemplate.slice(lastIndex), themeSlot: null, role: "literal" });
  }

  return collapseSpaces(spans);
}

function collapseSpaces(spans: SelectSpan[]): SelectSpan[] {
  const result: SelectSpan[] = [];
  for (const span of spans) {
    if (span.role === "literal" && span.text.trim() === "") {
      if (result.length > 0) result.push(span);
      continue;
    }
    result.push(span);
  }

  while (
    result.length > 0 &&
    result[result.length - 1].role === "literal" &&
    result[result.length - 1].text.trim() === ""
  ) {
    result.pop();
  }
  while (result.length > 0 && result[0].role === "literal" && result[0].text.trim() === "") {
    result.shift();
  }

  const collapsed: SelectSpan[] = [];
  for (let i = 0; i < result.length; i++) {
    const span = result[i];
    if (span.role === "literal" && span.text.trim() === "") {
      const next = result[i + 1];
      if (!next) continue;
      if (next.role === "literal" && next.text.trim() === "") continue;
    }
    collapsed.push(span);
  }

  return collapsed;
}

export function computeBlockVisibility(elements: Record<string, ResolvedElement>): boolean {
  for (const elem of Object.values(elements)) {
    if (elem.role === "icon" || elem.role === "connector") continue;
    if (elem.text !== "") return true;
  }
  return false;
}
