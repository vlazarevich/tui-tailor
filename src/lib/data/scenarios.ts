import type { ScenarioData } from "../types";

export interface ScenarioPreset {
  id: string;
  name: string;
  surfaceId: string;
  data: ScenarioData;
}

const terminalPromptScenarios: ScenarioPreset[] = [
  {
    id: "home-directory",
    name: "Home Directory",
    surfaceId: "terminal-prompt",
    data: {
      cwd: "~",
      user: "dev",
      host: "macbook",
      shell: "zsh",
      os: "arch",
      time: "14:32",
    },
  },
  {
    id: "git-repository",
    name: "Git Repository",
    surfaceId: "terminal-prompt",
    data: {
      cwd: "~/projects/webapp",
      user: "dev",
      host: "macbook",
      branch: "main",
      dirty: true,
      staged: 2,
      unstaged: 3,
      untracked: 1,
      deleted: 1,
      renamed: 0,
      linesAdded: 142,
      linesRemoved: 37,
      time: "14:32",
    },
  },
  {
    id: "node-project",
    name: "Node Project",
    surfaceId: "terminal-prompt",
    data: {
      cwd: "~/projects/api",
      user: "dev",
      host: "macbook",
      branch: "feature/auth",
      dirty: false,
      staged: 0,
      unstaged: 0,
      untracked: 0,
      ahead: 3,
      behind: 1,
      nodeVersion: "22.5.0",
      nodeTargetVersion: "20.10.0",
      time: "09:15",
    },
  },
  {
    id: "python-project",
    name: "Python Project",
    surfaceId: "terminal-prompt",
    data: {
      cwd: "~/ml/training",
      user: "researcher",
      host: "gpu-server",
      branch: "experiment/v2",
      dirty: false,
      pythonVersion: "3.12.1",
      pythonTargetVersion: "3.11.0",
      k8sContext: "prod-cluster",
      time: "22:47",
    },
  },
  {
    id: "error-state",
    name: "Error State",
    surfaceId: "terminal-prompt",
    data: {
      cwd: "~/projects/webapp",
      user: "dev",
      host: "macbook",
      branch: "main",
      dirty: true,
      unstaged: 5,
      exitCode: 127,
      cmdDuration: "2.4s",
      time: "16:03",
    },
  },
  {
    id: "sudo-shell",
    name: "Sudo Shell",
    surfaceId: "terminal-prompt",
    data: {
      cwd: "/etc",
      user: "root",
      host: "server",
      shell: "bash",
      os: "ubuntu",
      isSudo: true,
      battery: "87%",
      memUsage: "62%",
      diskUsage: "41%",
      time: "11:10",
    },
  },
  {
    id: "cloud-stack",
    name: "Cloud",
    surfaceId: "terminal-prompt",
    data: {
      cwd: "~/infra/platform",
      user: "dev",
      host: "macbook",
      awsProfile: "prod",
      k8sContext: "prod-cluster",
      dockerContext: "desktop-linux",
      terraformWorkspace: "default",
      time: "13:20",
    },
  },
  {
    id: "multiline-command",
    name: "Multiline Cmd",
    surfaceId: "terminal-prompt",
    data: {
      cwd: "~/projects/webapp",
      user: "dev",
      host: "macbook",
      branch: "main",
      dirty: false,
      multilineCommand: true,
      time: "10:00",
    },
  },
];

export const SCENARIOS: ScenarioPreset[] = [...terminalPromptScenarios];

export function getScenariosBySurfaceId(surfaceId: string): ScenarioPreset[] {
  return SCENARIOS.filter((s) => s.surfaceId === surfaceId);
}
