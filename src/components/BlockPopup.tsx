import { useEffect, useRef } from "react";
import type { BlockDefinition, ZoneDefinition } from "../lib/types";

interface Props {
  def: BlockDefinition;
  activeStyle: string;
  index: number;
  totalInZone: number;
  enabledZones: ZoneDefinition[];
  currentZoneId: string;
  anchorEl: HTMLElement | null;
  onSetStyle: (style: string) => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onMoveToZone: (zoneId: string) => void;
  onRemove: () => void;
  onClose: () => void;
}

export default function BlockPopup({
  def,
  activeStyle,
  index,
  totalInZone,
  enabledZones,
  currentZoneId,
  anchorEl,
  onSetStyle,
  onMoveLeft,
  onMoveRight,
  onMoveToZone,
  onRemove,
  onClose,
}: Props) {
  const popupRef = useRef<HTMLDivElement>(null);
  const otherZones = enabledZones.filter((z) => z.id !== currentZoneId);

  // Dismiss on outside click
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        anchorEl &&
        !anchorEl.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [anchorEl, onClose]);

  const styleNames = Object.keys(def.styles);

  return (
    <div
      ref={popupRef}
      className="absolute z-50 bg-surface-secondary outline-1 outline-border-primary shadow-lg min-w-[16ch] mt-1"
    >
      {/* Style selector */}
      <div className="px-[1ch] py-0 text-text-muted border-b border-border-muted">Style</div>
      <div className="px-[1ch] py-0 flex flex-col">
        {styleNames.map((s) => (
          <button
            key={s}
            onClick={() => onSetStyle(s)}
            className={`text-left px-[1ch] py-0 cursor-pointer font-mono ${
              activeStyle === s ? "text-accent" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {activeStyle === s ? "● " : "○ "}
            {s}
          </button>
        ))}
      </div>

      {/* Reorder */}
      <div className="px-[1ch] py-0 border-t border-border-muted flex items-center gap-[1ch]">
        <button
          onClick={onMoveLeft}
          disabled={index === 0}
          className="cursor-pointer text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-default"
          title="Move left"
        >
          ←
        </button>
        <button
          onClick={onMoveRight}
          disabled={index >= totalInZone - 1}
          className="cursor-pointer text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-default"
          title="Move right"
        >
          →
        </button>
        <span className="flex-1" />
        <button
          onClick={onRemove}
          className="cursor-pointer text-text-muted hover:text-semantic-error"
          title="Remove block"
        >
          ×
        </button>
      </div>

      {/* Zone transfer — only when other enabled zones exist */}
      {otherZones.length > 0 && (
        <div className="border-t border-border-muted">
          <div className="px-[1ch] py-0 text-text-muted">Move to →</div>
          {otherZones.map((z) => (
            <button
              key={z.id}
              onClick={() => onMoveToZone(z.id)}
              className="block w-full text-left px-[2ch] py-0 cursor-pointer text-text-secondary hover:text-text-primary font-mono"
            >
              {z.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
