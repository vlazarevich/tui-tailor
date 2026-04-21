import type { ThemeDefinition } from "./data/themes";

export function hexToRgb(hex: string): [number, number, number] | null {
  const match = hex.match(/^#([0-9a-f]{6})$/i);
  if (!match) return null;
  const n = parseInt(match[1], 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

export function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4),
  );
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function autoContrast(bgHex: string): "#ffffff" | "#000000" {
  const bg = hexToRgb(bgHex);
  if (!bg) return "#000000";
  const bgLum = relativeLuminance(bg);
  const contrastWithWhite = (1.0 + 0.05) / (bgLum + 0.05);
  const contrastWithBlack = (bgLum + 0.05) / (0.0 + 0.05);
  return contrastWithWhite >= contrastWithBlack ? "#ffffff" : "#000000";
}

export function resolveSlot(slot: string, theme: ThemeDefinition): string | null {
  const direct = theme.tokens[`--tt-color-${slot}`];
  if (direct) return direct;
  const dash = slot.lastIndexOf("-");
  if (dash > 0) return theme.tokens[`--tt-color-${slot.slice(0, dash)}`] ?? null;
  return null;
}
