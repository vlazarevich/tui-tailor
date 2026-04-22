// One-off snapshot script: writes golden files for bash/pwsh exporters.
// Run with:  node --experimental-strip-types scripts/snapshot-exporters.ts
// Regenerate after refactor and diff to check for drift.

import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { exportBash } from "../src/lib/exporters/bash.ts";
import { exportPowerShell } from "../src/lib/exporters/powershell.ts";
import type { SurfaceConfig, ZoneLayoutType, BlockInstance } from "../src/lib/types.ts";
import { BLOCKS } from "../src/lib/data/blocks.ts";
import type { ThemeDefinition } from "../src/lib/data/themes.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "src", "lib", "exporters", "__fixtures__");
mkdirSync(OUT, { recursive: true });

// Use a deterministic theme so diffs are stable.
const THEME: ThemeDefinition = {
  id: "catppuccin-mocha",
  name: "Catppuccin Mocha",
  tokens: {
    "--tt-surface-terminal": "#11111b",
    "--tt-text-muted": "#6c7086",
    "--tt-color-vcs": "#cba6f7",
    "--tt-color-vcs-ahead": "#94e2d5",
    "--tt-color-vcs-behind": "#fab387",
    "--tt-color-vcs-dirty": "#f38ba8",
    "--tt-color-path": "#f9e2af",
    "--tt-color-host": "#89b4fa",
    "--tt-color-user": "#a6e3a1",
    "--tt-color-error": "#f38ba8",
    "--tt-color-warning": "#fab387",
    "--tt-color-info": "#89dceb",
    "--tt-border-primary": "#45475a",
  },
};

const LAYOUTS: ZoneLayoutType[] = ["plain", "flow", "brackets", "powerline", "powertab"];
const STYLES = ["zen", "minimal", "extended"];
const ALL_BLOCK_IDS = BLOCKS.map((b) => b.id);

function mkConfig(blockIds: string[], style: string, layout: ZoneLayoutType): SurfaceConfig {
  const blocks: BlockInstance[] = blockIds.map((blockId) => ({ blockId, style }));
  return {
    surfaceId: "terminal-prompt",
    themeId: THEME.id,
    zones: { "left-prompt": { blocks, layout } },
    globalOptions: { "prompt-char": "❯", multiline: false },
  };
}

function sectionsToString(sections: { label: string; code: string }[]): string {
  return sections.map((s) => `### ${s.label}\n${s.code}`).join("\n\n");
}

function write(name: string, text: string) {
  writeFileSync(join(OUT, name), text);
  console.log("wrote", name);
}

// 1. Every block × every style at default (plain) layout
for (const blockId of ALL_BLOCK_IDS) {
  for (const style of STYLES) {
    const cfg = mkConfig([blockId], style, "plain");
    write(`bash__${blockId}__${style}__plain.txt`, sectionsToString(exportBash(cfg, THEME)));
    write(`pwsh__${blockId}__${style}__plain.txt`, sectionsToString(exportPowerShell(cfg, THEME)));
  }
}

// 2. Mixed config × each layout
const MIX = ["user", "host", "cwd", "git-branch", "exit-code", "node-version"];
for (const layout of LAYOUTS) {
  const cfg = mkConfig(MIX, "minimal", layout);
  write(`bash__mix__minimal__${layout}.txt`, sectionsToString(exportBash(cfg, THEME)));
  write(`pwsh__mix__minimal__${layout}.txt`, sectionsToString(exportPowerShell(cfg, THEME)));
}

// 3. git-branch with all element variations (zen quirk)
for (const style of STYLES) {
  const cfg = mkConfig(["git-branch"], style, "flow");
  write(`bash__git-branch__${style}__flow.txt`, sectionsToString(exportBash(cfg, THEME)));
  write(`pwsh__git-branch__${style}__flow.txt`, sectionsToString(exportPowerShell(cfg, THEME)));
}

// 4. Right-prompt + multiline globals
{
  const cfg: SurfaceConfig = {
    surfaceId: "terminal-prompt",
    themeId: THEME.id,
    zones: {
      "left-prompt": { blocks: [{ blockId: "cwd", style: "minimal" }], layout: "plain" },
      "right-prompt": { blocks: [{ blockId: "time", style: "minimal" }], layout: "plain" },
    },
    globalOptions: { "prompt-char": "λ", multiline: true },
  };
  write("bash__rightprompt__multiline.txt", sectionsToString(exportBash(cfg, THEME)));
  write("pwsh__rightprompt__multiline.txt", sectionsToString(exportPowerShell(cfg, THEME)));
}

console.log("done.");
