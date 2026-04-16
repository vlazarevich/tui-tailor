import type { BlockDefinition } from "./types";

const blocks: BlockDefinition[] = [
  {
    id: "user",
    name: "Username",
    category: "essential",
    surfaces: ["terminal-prompt"],
    elements: {
      username: { source: "user", role: "content" },
      icon: { value: "", role: "icon" },
      connector: { value: "as", role: "connector" },
    },
    styles: {
      zen: "{username}",
      minimal: "{username}",
      extended: "{icon} {username}",
    },
    themeSlot: "user",
    defaultStyle: "minimal",
  },
  {
    id: "host",
    name: "Hostname",
    category: "essential",
    surfaces: ["terminal-prompt"],
    elements: {
      hostname: { source: "host", role: "content" },
      icon: { value: "🖳", role: "icon" },
      connector: { value: "at", role: "connector" },
    },
    styles: {
      zen: "{hostname}",
      minimal: "{hostname}",
      extended: "{icon} {hostname}",
    },
    themeSlot: "host",
    defaultStyle: "minimal",
  },
  {
    id: "cwd",
    name: "Directory",
    category: "essential",
    surfaces: ["terminal-prompt"],
    elements: {
      dir: { source: "cwd", role: "content" },
      icon: { value: "🗀", role: "icon" },
      connector: { value: "in", role: "connector" },
    },
    styles: {
      zen: "{dir}",
      minimal: "{icon} {dir}",
      extended: "{icon} {dir}",
    },
    themeSlot: "path",
    defaultStyle: "minimal",
  },
  {
    id: "git-branch",
    name: "Git Branch",
    category: "git",
    surfaces: ["terminal-prompt"],
    elements: {
      branch: { source: "branch", role: "content" },
      icon: { value: "", role: "icon" },
      ahead: { source: "ahead", format: "↑{}", role: "content", themeSlot: "vcs-ahead" },
      behind: { source: "behind", format: "↓{}", role: "content", themeSlot: "vcs-behind" },
      dirty: { source: "dirty", format: "*", role: "content", themeSlot: "vcs-dirty" },
      connector: { value: "on", role: "connector" },
    },
    styles: {
      zen: "{dirty} {branch}",
      minimal: "{icon} {branch} {dirty}",
      extended: "{icon} {branch} {ahead}{behind} {dirty}",
    },
    themeSlot: "vcs",
    defaultStyle: "minimal",
  },
  {
    id: "git-status",
    name: "Git Status",
    category: "git",
    surfaces: ["terminal-prompt"],
    elements: {
      staged: { source: "staged", format: "+{}", role: "content" },
      unstaged: { source: "unstaged", format: "~{}", role: "content" },
      untracked: { source: "untracked", format: "?{}", role: "content" },
      icon: { value: "", role: "icon" },
      connector: { value: "", role: "connector" },
    },
    styles: {
      zen: "{staged}{unstaged}{untracked}",
      minimal: "{icon} {staged}{unstaged}{untracked}",
      extended: "{icon} {staged} {unstaged} {untracked}",
    },
    themeSlot: "vcs",
    defaultStyle: "minimal",
  },
  {
    id: "exit-code",
    name: "Exit Code",
    category: "status",
    surfaces: ["terminal-prompt"],
    elements: {
      code: { source: "exitCode", role: "content" },
      icon: { value: "✗", role: "icon" },
      connector: { value: "", role: "connector" },
    },
    styles: {
      zen: "{code}",
      minimal: "{icon}{code}",
      extended: "{icon} exit:{code}",
    },
    themeSlot: "error",
    defaultStyle: "minimal",
  },
  {
    id: "time",
    name: "Time",
    category: "status",
    surfaces: ["terminal-prompt"],
    elements: {
      time: { source: "time", role: "content" },
      icon: { value: "", role: "icon" },
      connector: { value: "", role: "connector" },
    },
    styles: {
      zen: "{time}",
      minimal: "{icon} {time}",
      extended: "{icon} {time}",
    },
    themeSlot: "info",
    defaultStyle: "minimal",
  },
  {
    id: "jobs",
    name: "Background Jobs",
    category: "status",
    surfaces: ["terminal-prompt"],
    elements: {
      count: { source: "jobCount", role: "content" },
      icon: { value: "✦", role: "icon" },
      connector: { value: "", role: "connector" },
    },
    styles: {
      zen: "{count}",
      minimal: "{icon}{count}",
      extended: "{icon} {count} jobs",
    },
    themeSlot: "info",
    defaultStyle: "minimal",
  },
  {
    id: "cmd-duration",
    name: "Command Duration",
    category: "status",
    surfaces: ["terminal-prompt"],
    elements: {
      duration: { source: "cmdDuration", role: "content" },
      icon: { value: "", role: "icon" },
      connector: { value: "took", role: "connector" },
    },
    styles: {
      zen: "{duration}",
      minimal: "{icon} {duration}",
      extended: "{icon} {duration}",
    },
    themeSlot: "info",
    defaultStyle: "minimal",
  },
  // Environment blocks
  {
    id: "node-version",
    name: "Node.js Version",
    category: "environment",
    surfaces: ["terminal-prompt"],
    elements: {
      version: { source: "nodeVersion", role: "content" },
      icon: { value: "node", role: "icon" },
      connector: { value: "via", role: "connector" },
    },
    styles: {
      zen: "{version}",
      minimal: "{icon} {version}",
      extended: "{icon} v{version}",
    },
    themeSlot: "info",
    defaultStyle: "minimal",
  },
  {
    id: "python-version",
    name: "Python Version",
    category: "environment",
    surfaces: ["terminal-prompt"],
    elements: {
      version: { source: "pythonVersion", role: "content" },
      icon: { value: "py", role: "icon" },
      connector: { value: "via", role: "connector" },
    },
    styles: {
      zen: "{version}",
      minimal: "{icon} {version}",
      extended: "{icon} v{version}",
    },
    themeSlot: "info",
    defaultStyle: "minimal",
  },
  {
    id: "ruby-version",
    name: "Ruby Version",
    category: "environment",
    surfaces: ["terminal-prompt"],
    elements: {
      version: { source: "rubyVersion", role: "content" },
      icon: { value: "", role: "icon" },
      connector: { value: "via", role: "connector" },
    },
    styles: {
      zen: "{version}",
      minimal: "{icon} {version}",
      extended: "{icon} v{version}",
    },
    themeSlot: "info",
    defaultStyle: "minimal",
  },
  {
    id: "golang-version",
    name: "Go Version",
    category: "environment",
    surfaces: ["terminal-prompt"],
    elements: {
      version: { source: "golangVersion", role: "content" },
      icon: { value: "", role: "icon" },
      connector: { value: "via", role: "connector" },
    },
    styles: {
      zen: "{version}",
      minimal: "{icon} {version}",
      extended: "{icon} v{version}",
    },
    themeSlot: "info",
    defaultStyle: "minimal",
  },
  {
    id: "rust-version",
    name: "Rust Version",
    category: "environment",
    surfaces: ["terminal-prompt"],
    elements: {
      version: { source: "rustVersion", role: "content" },
      icon: { value: "", role: "icon" },
      connector: { value: "via", role: "connector" },
    },
    styles: {
      zen: "{version}",
      minimal: "{icon} {version}",
      extended: "{icon} v{version}",
    },
    themeSlot: "info",
    defaultStyle: "minimal",
  },
  {
    id: "java-version",
    name: "Java Version",
    category: "environment",
    surfaces: ["terminal-prompt"],
    elements: {
      version: { source: "javaVersion", role: "content" },
      icon: { value: "", role: "icon" },
      connector: { value: "via", role: "connector" },
    },
    styles: {
      zen: "{version}",
      minimal: "{icon} {version}",
      extended: "{icon} v{version}",
    },
    themeSlot: "info",
    defaultStyle: "minimal",
  },
  // Cloud blocks
  {
    id: "aws-profile",
    name: "AWS Profile",
    category: "cloud",
    surfaces: ["terminal-prompt"],
    elements: {
      profile: { source: "awsProfile", role: "content" },
      icon: { value: "", role: "icon" },
      connector: { value: "on", role: "connector" },
    },
    styles: {
      zen: "{profile}",
      minimal: "{icon} {profile}",
      extended: "{icon} {profile}",
    },
    themeSlot: "warning",
    defaultStyle: "minimal",
  },
  {
    id: "azure-subscription",
    name: "Azure Subscription",
    category: "cloud",
    surfaces: ["terminal-prompt"],
    elements: {
      subscription: { source: "azureSub", role: "content" },
      icon: { value: "󰠅", role: "icon" },
      connector: { value: "on", role: "connector" },
    },
    styles: {
      zen: "{subscription}",
      minimal: "{icon} {subscription}",
      extended: "{icon} {subscription}",
    },
    themeSlot: "info",
    defaultStyle: "minimal",
  },
  {
    id: "gcp-project",
    name: "GCP Project",
    category: "cloud",
    surfaces: ["terminal-prompt"],
    elements: {
      project: { source: "gcpProject", role: "content" },
      icon: { value: "", role: "icon" },
      connector: { value: "on", role: "connector" },
    },
    styles: {
      zen: "{project}",
      minimal: "{icon} {project}",
      extended: "{icon} {project}",
    },
    themeSlot: "info",
    defaultStyle: "minimal",
  },
  {
    id: "kubernetes-context",
    name: "Kubernetes Context",
    category: "cloud",
    surfaces: ["terminal-prompt"],
    elements: {
      context: { source: "k8sContext", role: "content" },
      icon: { value: "󱃾", role: "icon" },
      connector: { value: "on", role: "connector" },
    },
    styles: {
      zen: "{context}",
      minimal: "{icon} {context}",
      extended: "{icon} {context}",
    },
    themeSlot: "info",
    defaultStyle: "minimal",
  },
];

export const BLOCKS: BlockDefinition[] = blocks;

export const CATEGORY_ORDER = ["essential", "git", "status", "environment", "cloud"] as const;

export function getBlocksForSurface(surfaceId: string): BlockDefinition[] {
  return blocks.filter((b) => b.surfaces.includes(surfaceId));
}

export function getBlocksByCategoryForSurface(surfaceId: string): Record<string, BlockDefinition[]> {
  const surfaceBlocks = getBlocksForSurface(surfaceId);
  const grouped: Record<string, BlockDefinition[]> = {};

  // Build groups
  for (const block of surfaceBlocks) {
    if (!grouped[block.category]) {
      grouped[block.category] = [];
    }
    grouped[block.category].push(block);
  }

  // Return in defined category order
  const ordered: Record<string, BlockDefinition[]> = {};
  for (const cat of CATEGORY_ORDER) {
    if (grouped[cat]) {
      ordered[cat] = grouped[cat];
    }
  }
  // Include any categories not in CATEGORY_ORDER at the end
  for (const cat of Object.keys(grouped)) {
    if (!ordered[cat]) {
      ordered[cat] = grouped[cat];
    }
  }
  return ordered;
}

export function getBlockById(id: string): BlockDefinition | undefined {
  return blocks.find((b) => b.id === id);
}
