import type { Surface, ZoneLayout, ZoneLayoutType } from "../types";

export const LAYOUT_CONFIGS: Record<ZoneLayoutType, ZoneLayout> = {
  plain: { type: "plain", config: { gap: " " } },
  flow: { type: "flow", config: { gap: " " } },
  brackets: { type: "brackets", config: { open: "[", close: "]", padding: "", gap: "─" } },
  powerline: { type: "powerline", config: { lead: "", trail: "" } },
  powertab: { type: "powertab", config: { lead: "", trail: "" } },
};

export function getLayoutForType(type: ZoneLayoutType): ZoneLayout {
  return LAYOUT_CONFIGS[type];
}

export const SURFACES: Surface[] = [
  {
    id: "terminal-prompt",
    name: "Terminal Prompt",
    zones: [
      {
        id: "left-prompt",
        name: "Left Prompt",
        targetBindings: {
          "bash-ps1": { slot: "PS1" },
          "powershell-prompt": { slot: "prompt-body" },
        },
      },
      {
        id: "right-prompt",
        name: "Right Prompt",
        optional: true,
        targetBindings: {
          "bash-ps1": { slot: "PS1", strategy: "ansi-cursor" },
          "powershell-prompt": { slot: "rprompt" },
        },
      },
      {
        id: "continuation-prompt",
        name: "Continuation Prompt",
        optional: true,
        targetBindings: {
          "bash-ps1": { slot: "PS2" },
          "powershell-prompt": { slot: "continuation" },
        },
      },
    ],
    globalOptions: [
      { id: "multiline", name: "Multiline", type: "boolean", defaultValue: false },
      { id: "prompt-char", name: "Prompt Character", type: "string", defaultValue: "❯" },
    ],
    defaultLayout: "plain",
  },
];

export function getSurfaceById(id: string): Surface | undefined {
  return SURFACES.find((s) => s.id === id);
}

export const DEFAULT_SURFACE_ID = "terminal-prompt";
