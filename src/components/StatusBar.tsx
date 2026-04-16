import { useComposerState, useActiveConfig } from "../lib/composerContext";
import { getSurfaceById } from "../lib/surfaces";
import { getThemeById } from "../lib/themes";

export default function StatusBar() {
  const state = useComposerState();
  const config = useActiveConfig();
  const surface = getSurfaceById(state.activeSurfaceId);
  const theme = getThemeById(config.themeId);

  const blockCount = Object.values(config.zones).reduce((sum, zone) => sum + zone.blocks.length, 0);

  return (
    <div className="flex items-center justify-between px-[1ch] py-0 bg-surface-secondary border-t border-border-primary text-text-muted">
      <div className="flex gap-[2ch]">
        <span>{surface?.name ?? state.activeSurfaceId}</span>
        <span>
          {blockCount} block{blockCount !== 1 ? "s" : ""}
        </span>
      </div>
      <span>{theme?.name ?? config.themeId}</span>
    </div>
  );
}
