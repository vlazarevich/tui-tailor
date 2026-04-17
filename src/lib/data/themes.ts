export interface ThemeDefinition {
  id: string;
  name: string;
  tokens: Record<string, string>;
}

const catppuccinMocha: ThemeDefinition = {
  id: "catppuccin-mocha",
  name: "Catppuccin Mocha",
  tokens: {
    "--tt-surface-primary": "#1e1e2e",
    "--tt-surface-secondary": "#181825",
    "--tt-surface-elevated": "#313244",
    "--tt-surface-terminal": "#11111b",
    "--tt-text-primary": "#cdd6f4",
    "--tt-text-secondary": "#bac2de",
    "--tt-text-muted": "#6c7086",
    "--tt-color-vcs": "#cba6f7",
    "--tt-color-path": "#f9e2af",
    "--tt-color-host": "#89b4fa",
    "--tt-color-user": "#a6e3a1",
    "--tt-color-error": "#f38ba8",
    "--tt-color-warning": "#fab387",
    "--tt-color-info": "#89dceb",
    "--tt-color-success": "#a6e3a1",
    "--tt-color-accent": "#cba6f7",
    "--tt-color-accent-muted": "#585b70",
    "--tt-border-primary": "#45475a",
    "--tt-border-muted": "#313244",
    "--tt-color-vcs-ahead": "#94e2d5",
    "--tt-color-vcs-behind": "#fab387",
    "--tt-color-vcs-dirty": "#f38ba8",
  },
};

const tokyoNight: ThemeDefinition = {
  id: "tokyo-night",
  name: "Tokyo Night",
  tokens: {
    "--tt-surface-primary": "#1a1b26",
    "--tt-surface-secondary": "#16161e",
    "--tt-surface-elevated": "#292e42",
    "--tt-surface-terminal": "#13131a",
    "--tt-text-primary": "#c0caf5",
    "--tt-text-secondary": "#a9b1d6",
    "--tt-text-muted": "#565f89",
    "--tt-color-vcs": "#bb9af7",
    "--tt-color-path": "#e0af68",
    "--tt-color-host": "#7aa2f7",
    "--tt-color-user": "#9ece6a",
    "--tt-color-error": "#f7768e",
    "--tt-color-warning": "#ff9e64",
    "--tt-color-info": "#7dcfff",
    "--tt-color-success": "#9ece6a",
    "--tt-color-accent": "#7aa2f7",
    "--tt-color-accent-muted": "#3b4261",
    "--tt-border-primary": "#3b4261",
    "--tt-border-muted": "#292e42",
    "--tt-color-vcs-ahead": "#73daca",
    "--tt-color-vcs-behind": "#ff9e64",
    "--tt-color-vcs-dirty": "#f7768e",
  },
};

const dracula: ThemeDefinition = {
  id: "dracula",
  name: "Dracula",
  tokens: {
    "--tt-surface-primary": "#282a36",
    "--tt-surface-secondary": "#21222c",
    "--tt-surface-elevated": "#44475a",
    "--tt-surface-terminal": "#1e1f29",
    "--tt-text-primary": "#f8f8f2",
    "--tt-text-secondary": "#e2e2dc",
    "--tt-text-muted": "#6272a4",
    "--tt-color-vcs": "#bd93f9",
    "--tt-color-path": "#f1fa8c",
    "--tt-color-host": "#8be9fd",
    "--tt-color-user": "#50fa7b",
    "--tt-color-error": "#ff5555",
    "--tt-color-warning": "#ffb86c",
    "--tt-color-info": "#8be9fd",
    "--tt-color-success": "#50fa7b",
    "--tt-color-accent": "#ff79c6",
    "--tt-color-accent-muted": "#44475a",
    "--tt-border-primary": "#6272a4",
    "--tt-border-muted": "#44475a",
    "--tt-color-vcs-ahead": "#8be9fd",
    "--tt-color-vcs-behind": "#ffb86c",
    "--tt-color-vcs-dirty": "#ff5555",
  },
};

export const THEMES: ThemeDefinition[] = [catppuccinMocha, tokyoNight, dracula];

export const DEFAULT_THEME_ID = "catppuccin-mocha";

export function getThemeById(id: string): ThemeDefinition | undefined {
  return THEMES.find((t) => t.id === id);
}
