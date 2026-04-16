import type { ThemeDefinition } from "./themes";

export function applyTheme(theme: ThemeDefinition, element: HTMLElement = document.documentElement) {
  for (const [property, value] of Object.entries(theme.tokens)) {
    element.style.setProperty(property, value);
  }
}
