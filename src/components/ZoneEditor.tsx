import { useState } from "react";
import type { BlockInstance, ZoneDefinition, ZoneLayout, ZoneLayoutType } from "../lib/types";
import { getBlockById } from "../lib/registry";
import { useComposerDispatch } from "../lib/composerContext";
import BlockTag from "./BlockTag";
import BlockPopup from "./BlockPopup";

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
      return { type: "brackets", config: { open: "[", close: "]", padding: "", gap: "─" } };
    case "powerline":
      return { type: "powerline", config: { separator: ">", terminator: ">" } };
    case "powertab":
      return { type: "powertab", config: { separator: ">", terminator: ">" } };
  }
}

interface Props {
  zone: ZoneDefinition;
  blocks: BlockInstance[];
  layout?: ZoneLayout;
  enabledZones: ZoneDefinition[];
  onDisable?: () => void;
}

export default function ZoneEditor({ zone, blocks, layout, enabledZones, onDisable }: Props) {
  const dispatch = useComposerDispatch();
  const [openPopup, setOpenPopup] = useState<{ index: number; anchor: HTMLButtonElement } | null>(null);

  const currentLayoutType = layout?.type ?? "plain";

  function handleSetStyle(index: number, style: string) {
    dispatch({ type: "SET_STYLE", zoneId: zone.id, index, style });
  }

  function handleMoveLeft(index: number, anchor: HTMLButtonElement) {
    if (index === 0) return;
    dispatch({ type: "REORDER_BLOCK", zoneId: zone.id, fromIndex: index, toIndex: index - 1 });
    setOpenPopup({ index: index - 1, anchor });
  }

  function handleMoveRight(index: number, anchor: HTMLButtonElement) {
    if (index >= blocks.length - 1) return;
    dispatch({ type: "REORDER_BLOCK", zoneId: zone.id, fromIndex: index, toIndex: index + 1 });
    setOpenPopup({ index: index + 1, anchor });
  }

  function handleMoveToZone(index: number, toZoneId: string) {
    dispatch({ type: "MOVE_BLOCK_TO_ZONE", fromZoneId: zone.id, index, toZoneId });
    setOpenPopup(null);
  }

  function handleRemove(index: number) {
    dispatch({ type: "REMOVE_BLOCK", zoneId: zone.id, index });
    setOpenPopup(null);
  }

  function handleLayoutChange(type: ZoneLayoutType) {
    dispatch({ type: "SET_ZONE_LAYOUT", zoneId: zone.id, layout: defaultLayoutConfig(type) });
  }

  function handleApplyToAll() {
    dispatch({ type: "SET_ALL_ZONES_LAYOUT", layout: defaultLayoutConfig(currentLayoutType) });
  }

  return (
    <div className="outline-1 outline-border-primary">
      {/* Zone header */}
      <div className="px-[1ch] py-0 bg-surface-secondary text-text-muted flex items-center justify-between">
        <div className="flex items-center gap-[1ch]">
          <span className="uppercase">{zone.name}</span>
          {zone.optional && onDisable && (
            <button
              onClick={onDisable}
              className="text-text-muted hover:text-semantic-error cursor-pointer"
              title={`Disable ${zone.name}`}
            >
              ×
            </button>
          )}
        </div>
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

      {/* Block tags */}
      <div className="px-[1ch] py-[1lh] flex flex-wrap gap-x-[1ch] gap-y-[1lh] relative">
        {blocks.length === 0 ? (
          <span className="text-text-muted">No blocks — add from catalog</span>
        ) : (
          blocks.map((instance, i) => {
            const def = getBlockById(instance.blockId);
            if (!def) return null;
            const isOpen = openPopup?.index === i;
            return (
              <span key={`${instance.blockId}-${i}`} className="relative inline-block">
                <BlockTag
                  instance={instance}
                  def={def}
                  onGearClick={(e) => {
                    setOpenPopup(isOpen ? null : { index: i, anchor: e.currentTarget });
                  }}
                />
                {isOpen && openPopup && (
                  <BlockPopup
                    def={def}
                    activeStyle={instance.style}
                    index={i}
                    totalInZone={blocks.length}
                    enabledZones={enabledZones}
                    currentZoneId={zone.id}
                    anchorEl={openPopup.anchor}
                    onSetStyle={(style) => handleSetStyle(i, style)}
                    onMoveLeft={() => handleMoveLeft(i, openPopup.anchor)}
                    onMoveRight={() => handleMoveRight(i, openPopup.anchor)}
                    onMoveToZone={(toZoneId) => handleMoveToZone(i, toZoneId)}
                    onRemove={() => handleRemove(i)}
                    onClose={() => setOpenPopup(null)}
                  />
                )}
              </span>
            );
          })
        )}
      </div>
    </div>
  );
}
