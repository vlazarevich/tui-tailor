import { emitElements, selectSpans, computeBlockVisibility, renderZone } from "./renderer";
import { getBlockById } from "./registry";
import { THEMES } from "./themes";
import { getScenariosBySurfaceId } from "./scenarios";
import type { ZoneLayout } from "./types";

const theme = THEMES[0]; // Catppuccin Mocha
const scenarios = getScenariosBySurfaceId("terminal-prompt");
const gitScenario = scenarios.find((s) => s.id === "git-repository")!;

// --- Emit ---
const gitBranch = getBlockById("git-branch")!;
const elements = emitElements(gitBranch, gitScenario.data);
console.log("=== EMIT: git-branch with git-repository scenario ===");
for (const [name, el] of Object.entries(elements)) {
  console.log(`  ${name}: text="${el.text}" slot=${el.themeSlot} role=${el.role}`);
}

// --- Select ---
console.log("\n=== SELECT: zen style ===");
const zenSpans = selectSpans(gitBranch.styles.zen, elements);
console.log("  spans:", zenSpans.map((s) => `"${s.text}"(${s.role})`).join(" "));

console.log("\n=== SELECT: extended style ===");
const extSpans = selectSpans(gitBranch.styles.extended, elements);
console.log("  spans:", extSpans.map((s) => `"${s.text}"(${s.role})`).join(" "));

// --- Visibility ---
console.log("\n=== VISIBILITY ===");
console.log("  git-branch visible:", computeBlockVisibility(elements));

const nodeBlock = getBlockById("node-version")!;
const nodeElements = emitElements(nodeBlock, gitScenario.data);
console.log("  node-version visible:", computeBlockVisibility(nodeElements), "(no nodeVersion in scenario)");

// --- Full pipeline: plain layout ---
const blocks = [
  { block: getBlockById("cwd")!, style: "minimal" },
  { block: gitBranch, style: "minimal" },
  { block: nodeBlock, style: "minimal" },
];

const layouts: ZoneLayout[] = [
  { type: "plain", config: { gap: " " } },
  { type: "flow", config: { gap: " " } },
  { type: "brackets", config: { open: "[", close: "]", padding: " ", gap: " " } },
];

for (const layout of layouts) {
  console.log(`\n=== FULL PIPELINE: ${layout.type} layout ===`);
  const painted = renderZone(blocks, gitScenario.data, layout, theme);
  const text = painted.map((s) => s.text).join("");
  console.log(`  text: "${text}"`);
  console.log("  spans:", painted.map((s) => `"${s.text}"[fg:${s.fg ?? "-"} bg:${s.bg ?? "-"}]`).join(" "));
}
