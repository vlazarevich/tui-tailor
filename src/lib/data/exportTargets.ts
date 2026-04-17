import type { ExportTarget } from "../types";

export const EXPORT_TARGETS: ExportTarget[] = [
  {
    id: "bash-ps1",
    name: "Bash",
    surfaceId: "terminal-prompt",
    blockCosts: {},
    zoneCosts: {
      "right-prompt": 75,
    },
  },
  {
    id: "powershell-prompt",
    name: "PowerShell",
    surfaceId: "terminal-prompt",
    blockCosts: {},
    zoneCosts: {},
  },
];

export function getTargetsForSurface(surfaceId: string): ExportTarget[] {
  return EXPORT_TARGETS.filter((t) => t.surfaceId === surfaceId);
}

export function getTargetById(id: string): ExportTarget | undefined {
  return EXPORT_TARGETS.find((t) => t.id === id);
}
