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

function mkConfig(blockInsts: BlockInstance[], layout: ZoneLayoutType): SurfaceConfig {
  return {
    surfaceId: "terminal-prompt",
    themeId: THEME.id,
    zones: { "left-prompt": { blocks: blockInsts, layout } },
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

// 1. Every block × every defined style at default (plain) layout
for (const block of BLOCKS) {
  for (const style of Object.keys(block.styles)) {
    const cfg = mkConfig([{ blockId: block.id, style }], "plain");
    write(`bash__${block.id}__${style}__plain.txt`, sectionsToString(exportBash(cfg, THEME)));
    write(`pwsh__${block.id}__${style}__plain.txt`, sectionsToString(exportPowerShell(cfg, THEME)));
  }
}

// 2. Mixed config × each layout
const MIX: BlockInstance[] = [
  { blockId: "session", style: "user@host" },
  { blockId: "cwd", style: "tilde" },
  { blockId: "git", style: "minimal" },
  { blockId: "last-command", style: "code+duration" },
  { blockId: "node", style: "minimal" },
];
for (const layout of LAYOUTS) {
  const cfg = mkConfig(MIX, layout);
  write(`bash__mix__default__${layout}.txt`, sectionsToString(exportBash(cfg, THEME)));
  write(`pwsh__mix__default__${layout}.txt`, sectionsToString(exportPowerShell(cfg, THEME)));
}

// 3. git block with each style under flow layout
for (const style of Object.keys(BLOCKS.find((b) => b.id === "git")!.styles)) {
  const cfg = mkConfig([{ blockId: "git", style }], "flow");
  write(`bash__git__${style}__flow.txt`, sectionsToString(exportBash(cfg, THEME)));
  write(`pwsh__git__${style}__flow.txt`, sectionsToString(exportPowerShell(cfg, THEME)));
}

// 4. Right-prompt + multiline globals
{
  const cfg: SurfaceConfig = {
    surfaceId: "terminal-prompt",
    themeId: THEME.id,
    zones: {
      "left-prompt": { blocks: [{ blockId: "cwd", style: "tilde" }], layout: "plain" },
      "right-prompt": { blocks: [{ blockId: "clock", style: "time-only" }], layout: "plain" },
    },
    globalOptions: { "prompt-char": "λ", multiline: true },
  };
  write("bash__rightprompt__multiline.txt", sectionsToString(exportBash(cfg, THEME)));
  write("pwsh__rightprompt__multiline.txt", sectionsToString(exportPowerShell(cfg, THEME)));
}

console.log("done.");
