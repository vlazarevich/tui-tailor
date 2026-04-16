import { SURFACES } from "../lib/surfaces";
import { useComposerState, useComposerDispatch } from "../lib/composerContext";

export default function SurfaceSwitcher() {
  const state = useComposerState();
  const dispatch = useComposerDispatch();

  return (
    <div className="flex gap-[1ch]">
      {SURFACES.map((s) => (
        <button
          key={s.id}
          onClick={() => dispatch({ type: "SWITCH_SURFACE", surfaceId: s.id })}
          className={`px-[1ch] py-0 h-6 outline-1 font-mono cursor-pointer ${
            state.activeSurfaceId === s.id
              ? "bg-surface-elevated outline-accent text-accent"
              : "bg-surface-secondary outline-border-primary text-text-secondary hover:text-text-primary"
          }`}
        >
          {s.name}
        </button>
      ))}
    </div>
  );
}
