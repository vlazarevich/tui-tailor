import { useComposerState, useActiveConfig, useComposerDispatch } from "../lib/composerContext";
import { getSurfaceById } from "../lib/data/surfaces";
import ZoneEditor from "./ZoneEditor";
import type { ZoneDefinition } from "../lib/types";

export default function Canvas() {
  const state = useComposerState();
  const config = useActiveConfig();
  const dispatch = useComposerDispatch();
  const surface = getSurfaceById(state.activeSurfaceId);

  if (!surface) {
    return <div className="text-text-muted px-[2ch] py-6">No surface selected</div>;
  }

  // A zone is enabled if it's required OR its config.enabled !== false
  function isZoneEnabled(zone: ZoneDefinition): boolean {
    if (!zone.optional) return true;
    return config.zones[zone.id]?.enabled !== false;
  }

  const activeZones = surface.zones.filter((z) => isZoneEnabled(z));
  const disabledOptionalZones = surface.zones.filter((z) => z.optional && !isZoneEnabled(z));

  // Zones available for "move to" in popup: all currently enabled zones
  const enabledZoneDefs = activeZones;

  return (
    <div className="flex flex-col gap-6 overflow-y-auto px-[2ch] py-3">
      <div className="flex flex-col gap-6">
        {activeZones.map((zone) => (
          <ZoneEditor
            key={zone.id}
            zone={zone}
            blocks={config.zones[zone.id]?.blocks ?? []}
            layout={config.zones[zone.id]?.layout}
            enabledZones={enabledZoneDefs}
            onDisable={
              zone.optional
                ? () => dispatch({ type: "DISABLE_ZONE", zoneId: zone.id })
                : undefined
            }
          />
        ))}
      </div>

      {/* + buttons for disabled optional zones */}
      {disabledOptionalZones.length > 0 && (
        <div className="flex flex-wrap gap-[1ch]">
          {disabledOptionalZones.map((zone) => (
            <button
              key={zone.id}
              onClick={() => dispatch({ type: "ENABLE_ZONE", zoneId: zone.id })}
              className="px-[1ch] py-0 outline-1 outline-border-primary text-text-muted hover:text-text-secondary cursor-pointer font-mono"
              title={`Enable ${zone.name}`}
            >
              + {zone.name}
            </button>
          ))}
        </div>
      )}

      {surface.globalOptions.length > 0 && (
        <div className="flex items-center gap-[2ch] text-text-muted">
          <span>options:</span>
          {surface.globalOptions.map((opt, i) => (
            <span key={opt.id} className="flex items-center gap-[1ch]">
              {i > 0 && <span className="text-border-primary">|</span>}
              {opt.type === "boolean" ? (
                <>
                  <input
                    type="checkbox"
                    id={opt.id}
                    checked={config.globalOptions[opt.id] === true}
                    onChange={(e) => dispatch({ type: "SET_GLOBAL_OPTION", key: opt.id, value: e.target.checked })}
                    className="cursor-pointer"
                  />
                  <label htmlFor={opt.id} className="text-text-secondary cursor-pointer">
                    {opt.name}
                  </label>
                </>
              ) : (
                <>
                  <label htmlFor={opt.id} className="text-text-secondary">
                    {opt.name}
                  </label>
                  <input
                    type="text"
                    id={opt.id}
                    value={String(config.globalOptions[opt.id] ?? "")}
                    onChange={(e) => dispatch({ type: "SET_GLOBAL_OPTION", key: opt.id, value: e.target.value })}
                    className="bg-surface-terminal outline-1 outline-border-primary text-text-primary px-[1ch] py-0 font-mono w-[8ch] focus:outline-accent"
                  />
                </>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
