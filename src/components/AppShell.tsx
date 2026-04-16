import { useEffect, useRef } from "react";
import { useComposerState, useActiveConfig } from "../lib/composerContext";
import { saveSurfaceConfig, saveThemeId, saveActiveSurface } from "../lib/persistence";
import { applyTheme } from "../lib/applyTheme";
import { getThemeById } from "../lib/themes";
import SurfaceSwitcher from "./SurfaceSwitcher";
import ThemePicker from "./ThemePicker";
import BlockCatalog from "./BlockCatalog";
import Canvas from "./Canvas";
import ConfigShare from "./ConfigShare";
import StatusBar from "./StatusBar";

export default function AppShell() {
  const state = useComposerState();
  const config = useActiveConfig();
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(null);

  // Auto-save with 500ms debounce
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveSurfaceConfig(config);
      saveThemeId(config.themeId);
      saveActiveSurface(state.activeSurfaceId);
    }, 500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [config, state.activeSurfaceId]);

  // Apply theme whenever it changes
  useEffect(() => {
    const theme = getThemeById(config.themeId);
    if (theme) applyTheme(theme);
  }, [config.themeId]);

  return (
    <div className="flex flex-col h-screen bg-surface-primary text-text-primary font-mono">
      {/* Toolbar — 3 terminal rows: border (1lh) + content (1lh) + border (1lh) */}
      <div className="flex items-center justify-between px-[2ch] py-3 bg-surface-secondary border-y border-border-primary">
        <div className="flex items-center gap-[2ch]">
          <span className="text-accent">tui-tailor</span>
          <SurfaceSwitcher />
        </div>
        <ThemePicker />
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Block catalog — left panel */}
        <div className="w-56 border-r border-border-primary bg-surface-primary overflow-hidden flex flex-col">
          <BlockCatalog />
        </div>

        {/* Canvas — center */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Canvas />
          <div className="px-[2ch] pb-6">
            <ConfigShare />
          </div>
        </div>
      </div>

      {/* Status bar */}
      <StatusBar />
    </div>
  );
}
