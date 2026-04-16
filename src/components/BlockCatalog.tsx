import { useState } from "react";
import { useComposerState, useComposerDispatch } from "../lib/composerContext";
import { getBlocksByCategoryForSurface, getBlockById } from "../lib/registry";
import { getSurfaceById } from "../lib/surfaces";

const CATEGORY_LABELS: Record<string, string> = {
  essential: "Essential",
  git: "Git",
  status: "Status",
  environment: "Environment",
  cloud: "Cloud",
};

export default function BlockCatalog() {
  const state = useComposerState();
  const dispatch = useComposerDispatch();
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const grouped = getBlocksByCategoryForSurface(state.activeSurfaceId);
  const surface = getSurfaceById(state.activeSurfaceId);
  const defaultZoneId = surface?.zones[0]?.id;

  function handleAdd(blockId: string) {
    if (!defaultZoneId) return;
    const block = getBlockById(blockId);
    if (!block) return;
    dispatch({ type: "ADD_BLOCK", zoneId: defaultZoneId, blockId, style: block.defaultStyle });
  }

  function toggleCategory(cat: string) {
    setCollapsed((c) => ({ ...c, [cat]: !c[cat] }));
  }

  const lowerSearch = search.toLowerCase();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-[1ch] py-3 text-text-muted uppercase border-b border-border-muted">Blocks</div>
      <div className="px-[1ch] pt-3 pb-6">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-surface-terminal outline-1 outline-border-primary text-text-primary px-[1ch] py-0 font-mono focus:outline-accent"
        />
      </div>
      <div className="flex-1 overflow-y-auto px-[1ch]">
        {Object.entries(grouped).map(([category, blocks]) => {
          const filtered = blocks.filter((b) => b.name.toLowerCase().includes(lowerSearch));
          if (filtered.length === 0) return null;
          const isCollapsed = collapsed[category];

          return (
            <div key={category} className="mb-6">
              <button
                onClick={() => toggleCategory(category)}
                className="flex items-center gap-[1ch] w-full text-left text-text-muted uppercase py-0 cursor-pointer hover:text-text-secondary"
              >
                <span>{isCollapsed ? "▸" : "▾"}</span>
                <span>{CATEGORY_LABELS[category] ?? category}</span>
              </button>
              {!isCollapsed && (
                <div className="ml-[2ch]">
                  {filtered.map((block) => (
                    <div key={block.id} className="flex items-center justify-between py-0 group">
                      <span className="text-text-secondary">{block.name}</span>
                      <button
                        onClick={() => handleAdd(block.id)}
                        className="text-text-muted hover:text-accent cursor-pointer opacity-0 group-hover:opacity-100"
                        title={`Add ${block.name} to ${surface?.zones[0]?.name ?? "zone"}`}
                      >
                        +
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
