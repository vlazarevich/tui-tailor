import type { Surface } from "./types";

export const SURFACES: Surface[] = [
  {
    id: "terminal-prompt",
    name: "Terminal Prompt",
    zones: [
      { id: "left-prompt", name: "Left Prompt" },
      { id: "right-prompt", name: "Right Prompt", optional: true },
      { id: "continuation-prompt", name: "Continuation Prompt", optional: true },
    ],
    globalOptions: [
      { id: "multiline", name: "Multiline", type: "boolean", defaultValue: false },
      { id: "prompt-char", name: "Prompt Character", type: "string", defaultValue: "❯" },
    ],
    defaultLayout: { type: "plain", config: { gap: " " } },
  },
];

export function getSurfaceById(id: string): Surface | undefined {
  return SURFACES.find((s) => s.id === id);
}

export const DEFAULT_SURFACE_ID = "terminal-prompt";
