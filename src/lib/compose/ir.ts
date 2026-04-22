import type { ResolvedElement, RenderSpan } from "../types";

export type { RenderSpan } from "../types";

export interface SelectSpan {
  text: string;
  themeSlot: string | null;
  role: "content" | "icon" | "connector" | "literal";
}

export interface BlockSpans {
  blockId: string;
  spans: SelectSpan[];
  elements: Record<string, ResolvedElement>;
  themeSlot: string;
  visible: boolean;
}

export interface BlockBoundary {
  blockIndex: number;
  blockId: string;
  start: number;
  end: number;
}

export interface ArrangedZone {
  spans: RenderSpan[];
  blockBoundaries: BlockBoundary[];
}
