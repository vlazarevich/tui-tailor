import type { SurfaceConfig, CodeSection } from "../types";
import type { ThemeDefinition } from "../data/themes";
import { exportBash } from "./bash";
import { exportPowerShell } from "./powershell";

export function exportSurface(
  config: SurfaceConfig,
  targetId: string,
  theme: ThemeDefinition
): CodeSection[] {
  switch (targetId) {
    case "bash-ps1":
      return exportBash(config, theme);
    case "powershell-prompt":
      return exportPowerShell(config, theme);
    default:
      return [];
  }
}
