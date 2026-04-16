import { useState } from "react";
import type { BlockInstance, ZoneDefinition, ZoneLayout, ZoneLayoutType } from "../lib/types";
import { getBlockById } from "../lib/registry";
import { useComposerDispatch } from "../lib/composerContext";

const LAYOUT_OPTIONS: { type: ZoneLayoutType; label: string }[] = [
  { type: "plain", label: "Plain" },
  { type: "flow", label: "Flow" },
  { type: "brackets", label: "Brackets" },
  { type: "powerline", label: "Powerline" },
  { type: "powertab", label: "Powertab" },
];

function defaultLayoutConfig(type: ZoneLayoutType): ZoneLayout {
  switch (type) {
    case "plain":
      return { type: "plain", config: { gap: " " } };
    case "flow":
      return { type: "flow", config: { gap: " " } };
    case "brackets":
      return { type: "brackets", config: { open: "[", close: "]", padding: " ", gap: " " } };
    case "powerline":
      return { type: "powerline", config: { separator: "", terminator: "" } };
    case "powertab":
      return { type: "powertab", config: { separator: "", terminator: "" } };
  }
}

interface Props {
  zone: ZoneDefinition;
  blocks: BlockInstance[];
  layout?: ZoneLayout;
}

export default function ZoneEditor({ zone, blocks, layout }: Props) {
  const dispatch = useComposerDispatch();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const currentLayoutType = layout?.type ?? "plain";

  function handleRemove(index: number) {
    dispatch({ type: "REMOVE_BLOCK", zoneId: zone.id, index });
    if (expandedIndex === index) setExpandedIndex(null);
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    dispatch({ type: "REORDER_BLOCK", zoneId: zone.id, fromIndex: index, toIndex: index - 1 });
    if (expandedIndex === index) setExpandedIndex(index - 1);
  }

  function handleMoveDown(index: number) {
    if (index >= blocks.length - 1) return;
    dispatch({ type: "REORDER_BLOCK", zoneId: zone.id, fromIndex: index, toIndex: index + 1 });
    if (expandedIndex === index) setExpandedIndex(index + 1);
  }

  function handleSetStyle(index: number, style: string) {
    dispatch({ type: "SET_STYLE", zoneId: zone.id, index, style });
  }

  function handleLayoutChange(type: ZoneLayoutType) {
    const newLayout = defaultLayoutConfig(type);
    dispatch({ type: "SET_ZONE_LAYOUT", zoneId: zone.id, layout: newLayout });
  }

  function handleApplyToAll() {
    const newLayout = defaultLayoutConfig(currentLayoutType);
    dispatch({ type: "SET_ALL_ZONES_LAYOUT", layout: newLayout });
  }

  function handleLayoutConfigChange(layout: ZoneLayout) {
    dispatch({ type: "SET_ZONE_LAYOUT", zoneId: zone.id, layout });
  }

  return (
    <div className="outline-1 outline-border-primary">
      <div className="px-[1ch] py-0 bg-surface-secondary text-text-muted flex items-center justify-between">
        <span className="uppercase">{zone.name}</span>
        <div className="flex items-center gap-[1ch]">
          <select
            value={currentLayoutType}
            onChange={(e) => handleLayoutChange(e.target.value as ZoneLayoutType)}
            className="bg-surface-terminal h-6 text-text-secondary outline-1 outline-border-primary px-[1ch] py-0 font-mono cursor-pointer"
          >
            {LAYOUT_OPTIONS.map((opt) => (
              <option key={opt.type} value={opt.type}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleApplyToAll}
            className="text-text-muted hover:text-text-secondary cursor-pointer font-mono"
            title="Apply layout to all zones"
          >
            all
          </button>
        </div>
      </div>

      {/* Layout-specific config */}
      {layout && (layout.type === "brackets" || layout.type === "powerline" || layout.type === "powertab") && (
        <LayoutConfig layout={layout} onChange={handleLayoutConfigChange} />
      )}

      {blocks.length === 0 ? (
        <div className="px-[1ch] py-6 text-text-muted text-center">No blocks — add from catalog</div>
      ) : (
        <div>
          {blocks.map((instance, i) => {
            const def = getBlockById(instance.blockId);
            if (!def) return null;
            const isExpanded = expandedIndex === i;

            return (
              <div key={`${instance.blockId}-${i}`}>
                <div className="flex items-center gap-[1ch] px-[1ch] py-0">
                  <button
                    onClick={() => setExpandedIndex(isExpanded ? null : i)}
                    className={`flex-1 text-left cursor-pointer text-semantic-${def.themeSlot}`}
                  >
                    {def.name}
                    <span className="text-text-muted ml-[1ch]">{instance.style}</span>
                  </button>
                  <div className="flex gap-[1ch] text-text-muted">
                    <button
                      onClick={() => handleMoveUp(i)}
                      disabled={i === 0}
                      className="cursor-pointer hover:text-text-primary disabled:opacity-30 disabled:cursor-default"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => handleMoveDown(i)}
                      disabled={i >= blocks.length - 1}
                      className="cursor-pointer hover:text-text-primary disabled:opacity-30 disabled:cursor-default"
                    >
                      ↓
                    </button>
                    <button onClick={() => handleRemove(i)} className="cursor-pointer hover:text-semantic-error">
                      ×
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-[1ch] py-0 bg-surface-terminal">
                    <div className="text-text-muted">Style</div>
                    <div className="flex gap-[1ch]">
                      {Object.keys(def.styles).map((styleName) => (
                        <button
                          key={styleName}
                          onClick={() => handleSetStyle(i, styleName)}
                          className={`px-[1ch] py-0 outline-1 cursor-pointer font-mono ${
                            instance.style === styleName
                              ? "outline-accent text-accent bg-surface-elevated"
                              : "outline-border-primary text-text-muted hover:text-text-secondary"
                          }`}
                        >
                          {styleName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LayoutConfig({ layout, onChange }: { layout: ZoneLayout; onChange: (l: ZoneLayout) => void }) {
  if (layout.type === "brackets") {
    return (
      <div className="px-[1ch] py-0 bg-surface-terminal flex gap-[2ch] text-text-muted border-b border-border-muted">
        <label className="flex items-center gap-[1ch]">
          open
          <input
            type="text"
            value={layout.config.open}
            onChange={(e) => onChange({ ...layout, config: { ...layout.config, open: e.target.value } })}
            className="w-[3ch] bg-surface-secondary outline-1 outline-border-primary text-text-primary px-[1ch] py-0 font-mono focus:outline-accent"
          />
        </label>
        <label className="flex items-center gap-[1ch]">
          close
          <input
            type="text"
            value={layout.config.close}
            onChange={(e) => onChange({ ...layout, config: { ...layout.config, close: e.target.value } })}
            className="w-[3ch] bg-surface-secondary outline-1 outline-border-primary text-text-primary px-[1ch] py-0 font-mono focus:outline-accent"
          />
        </label>
      </div>
    );
  }

  if (layout.type === "powerline" || layout.type === "powertab") {
    return (
      <div className="px-[1ch] py-0 bg-surface-terminal flex gap-[2ch] text-text-muted border-b border-border-muted">
        <label className="flex items-center gap-[1ch]">
          sep
          <input
            type="text"
            value={layout.config.separator}
            onChange={(e) => onChange({ ...layout, config: { ...layout.config, separator: e.target.value } })}
            className="w-[3ch] bg-surface-secondary outline-1 outline-border-primary text-text-primary px-[1ch] py-0 font-mono focus:outline-accent"
          />
        </label>
        <label className="flex items-center gap-[1ch]">
          end
          <input
            type="text"
            value={layout.config.terminator}
            onChange={(e) => onChange({ ...layout, config: { ...layout.config, terminator: e.target.value } })}
            className="w-[3ch] bg-surface-secondary outline-1 outline-border-primary text-text-primary px-[1ch] py-0 font-mono focus:outline-accent"
          />
        </label>
      </div>
    );
  }

  return null;
}
