import { useState, useEffect, useCallback, useMemo } from "react";
import type { SurfaceConfig } from "../lib/types";
import type { ExportTarget } from "../lib/types";
import { exportSurfaceDetailed } from "../lib/exporters/index";
import { getThemeById } from "../lib/data/themes";
import { getSurfaceById } from "../lib/data/surfaces";

interface Props {
  config: SurfaceConfig;
  targets: ExportTarget[];
  onClose: () => void;
}

const INSTALL_HINTS: Record<string, string> = {
  "bash-ps1": "Add to ~/.bashrc",
  "powershell-prompt": "Add to $PROFILE",
};

export default function ExportPopup({ config, targets, onClose }: Props) {
  const [activeTargetId, setActiveTargetId] = useState(targets[0]?.id ?? "");
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const theme = getThemeById(config.themeId);
  const surface = getSurfaceById(config.surfaceId);
  const activeTarget = targets.find((t) => t.id === activeTargetId);

  const { sections, blockWarnings } = useMemo(() => {
    if (!theme) return { sections: [], blockWarnings: [] };
    const result = exportSurfaceDetailed(config, activeTargetId, theme);
    return { sections: result.sections, blockWarnings: result.warnings };
  }, [config, activeTargetId, theme]);

  // Zone cost warnings: find enabled zones with cost > 0
  const zoneWarnings: Array<{ zoneId: string; zoneName: string; message: string }> = [];
  if (activeTarget && surface) {
    for (const zoneDef of surface.zones) {
      const cost = activeTarget.zoneCosts[zoneDef.id] ?? 0;
      if (cost > 0) {
        const zoneConfig = config.zones[zoneDef.id];
        const isEnabled = !zoneDef.optional || zoneConfig?.enabled !== false;
        const hasBlocks = (zoneConfig?.blocks.length ?? 0) > 0;
        if (isEnabled && hasBlocks) {
          zoneWarnings.push({
            zoneId: zoneDef.id,
            zoneName: zoneDef.name,
            message:
              zoneDef.id === "right-prompt"
                ? "Right prompt uses cursor positioning — may be unreliable on terminal resize"
                : `${zoneDef.name} has limited support for this target (cost: ${cost})`,
          });
        }
      }
    }
  }

  const handleCopySection = useCallback((label: string, code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedSection(label);
      setTimeout(() => setCopiedSection(null), 2000);
    });
  }, []);

  const handleCopyAll = useCallback(() => {
    const all = sections.map((s) => s.code).join("\n\n");
    navigator.clipboard.writeText(all).then(() => {
      setCopiedSection("__all__");
      setTimeout(() => setCopiedSection(null), 2000);
    });
  }, [sections]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex flex-col w-[min(90vw,900px)] max-h-[85vh] bg-surface-primary outline-1 outline-border-primary font-mono">
        {/* Header */}
        <div className="flex items-center justify-between px-[2ch] py-[1lh] bg-surface-secondary border-b border-border-primary">
          <span className="text-text-primary uppercase tracking-wide">Export</span>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Target tabs */}
        <div className="flex gap-0 px-[2ch] pt-[1lh] bg-surface-secondary">
          {targets.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTargetId(t.id)}
              className={[
                "px-[2ch] py-0 cursor-pointer font-mono uppercase text-sm outline-1 outline-border-primary",
                t.id === activeTargetId
                  ? "bg-surface-primary text-text-primary"
                  : "bg-surface-elevated text-text-muted hover:text-text-secondary",
              ].join(" ")}
            >
              {t.name}
            </button>
          ))}
        </div>

        {/* Install hint + Copy All */}
        <div className="flex items-center justify-between px-[2ch] py-[1lh] bg-surface-secondary border-b border-border-primary">
          <span className="text-text-muted text-sm">
            {INSTALL_HINTS[activeTargetId] ?? "Add to your shell config"}
          </span>
          <button
            onClick={handleCopyAll}
            className="px-[2ch] py-0 outline-1 outline-border-primary text-text-secondary hover:text-text-primary cursor-pointer"
          >
            {copiedSection === "__all__" ? "Copied!" : "Copy All"}
          </button>
        </div>

        {/* Zone + block warnings */}
        {(zoneWarnings.length > 0 || blockWarnings.length > 0) && (
          <div className="px-[2ch] py-[1lh] flex flex-col gap-[0.5lh]">
            {zoneWarnings.map((w) => (
              <div key={`zone-${w.zoneId}`} className="text-semantic-warning text-sm">
                ⚠ {w.message}
              </div>
            ))}
            {blockWarnings.map((w, i) => (
              <div key={`block-${w.blockId}-${i}`} className="text-semantic-warning text-sm">
                ⚠ {w.blockName}: {w.reason} — block omitted from export
              </div>
            ))}
          </div>
        )}

        {/* Code sections */}
        <div className="flex flex-col gap-[1lh] px-[2ch] py-[1lh] overflow-y-auto flex-1">
          {sections.length === 0 ? (
            <div className="text-text-muted text-center py-[2lh]">
              Add blocks to your prompt zones to generate export code.
            </div>
          ) : (
            sections.map((section) => (
              <div key={section.label} className="flex flex-col gap-[0.5lh]">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted uppercase text-sm">{section.label}</span>
                  <button
                    onClick={() => handleCopySection(section.label, section.code)}
                    className="px-[1ch] py-0 outline-1 outline-border-primary text-text-muted hover:text-text-secondary cursor-pointer text-sm"
                  >
                    {copiedSection === section.label ? "Copied!" : "Copy"}
                  </button>
                </div>
                <pre className="bg-surface-terminal outline-1 outline-border-primary px-[1ch] py-[0.5lh] text-text-primary overflow-x-auto text-sm leading-relaxed whitespace-pre">
                  {section.code}
                </pre>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
