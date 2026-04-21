import type { BlockDefinition } from "./types";

export function templateElems(template: string): Set<string> {
  const elems = new Set<string>();
  for (const m of template.matchAll(/\{(\w+)\}/g)) elems.add(m[1]);
  return elems;
}

export function blockIcon(block: BlockDefinition): string {
  return Object.values(block.elements).find((e) => e.role === "icon")?.value ?? "";
}

export function blockConnector(block: BlockDefinition): string {
  return Object.values(block.elements).find((e) => e.role === "connector")?.value ?? "";
}

export function blockStyleTemplate(block: BlockDefinition, style: string): string {
  return block.styles[style] ?? block.styles[block.defaultStyle] ?? "";
}
