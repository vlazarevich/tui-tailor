import type { SurfaceConfig, CodeSection } from "../types";
import type { ThemeDefinition } from "../data/themes";
import { exportBashDetailed, type ExportWarning } from "./bash";
import { exportPowerShellDetailed } from "./powershell";

export type { ExportWarning } from "./bash";

export interface SurfaceExportResult {
  sections: CodeSection[];
  warnings: ExportWarning[];
}

export function exportSurfaceDetailed(
  config: SurfaceConfig,
  targetId: string,
  theme: ThemeDefinition,
): SurfaceExportResult {
  switch (targetId) {
    case "bash-ps1":
      return exportBashDetailed(config, theme);
    case "powershell-prompt":
      return exportPowerShellDetailed(config, theme);
    default:
      return { sections: [], warnings: [] };
  }
}

export function exportSurface(
  config: SurfaceConfig,
  targetId: string,
  theme: ThemeDefinition,
): CodeSection[] {
  return exportSurfaceDetailed(config, targetId, theme).sections;
}
