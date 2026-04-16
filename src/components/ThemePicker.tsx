import { THEMES } from "../lib/themes";
import { useActiveConfig, useComposerDispatch } from "../lib/composerContext";

export default function ThemePicker() {
  const config = useActiveConfig();
  const dispatch = useComposerDispatch();

  return (
    <select
      value={config.themeId}
      onChange={(e) => dispatch({ type: "SET_THEME", themeId: e.target.value })}
      className="px-[1ch] py-0 h-6 outline-1 outline-border-primary bg-surface-secondary text-text-secondary font-mono cursor-pointer focus:outline-accent hover:text-text-primary"
    >
      {THEMES.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  );
}
