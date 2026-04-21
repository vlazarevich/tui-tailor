import { useComposerState, useActiveConfig, isZoneEnabled } from "../lib/composerContext";
import { getSurfaceById, getLayoutForType } from "../lib/data/surfaces";
import { getScenariosBySurfaceId } from "../lib/data/scenarios";
import { getThemeById } from "../lib/data/themes";
import { getBlockById } from "../lib/data/blocks";
import { renderZone } from "../lib/renderer";
import type { PaintedSpan } from "../lib/renderer";
import type { ZoneConfig } from "../lib/types";

function SpanList({ spans }: { spans: PaintedSpan[] }) {
  return (
    <>
      {spans.map((span, i) => (
        <span
          key={i}
          style={{
            color: span.fg ?? undefined,
            backgroundColor: span.bg ?? undefined,
          }}
        >
          {span.text}
        </span>
      ))}
    </>
  );
}

function renderZoneSpans(zoneConfig: ZoneConfig | undefined, scenarioData: Parameters<typeof renderZone>[1], layout: Parameters<typeof renderZone>[2], theme: Parameters<typeof renderZone>[3]): PaintedSpan[] {
  if (!zoneConfig || zoneConfig.blocks.length === 0) return [];
  const blocks = zoneConfig.blocks
    .map((inst) => {
      const def = getBlockById(inst.blockId);
      return def ? { block: def, style: inst.style } : null;
    })
    .filter((b): b is NonNullable<typeof b> => b !== null);
  if (blocks.length === 0) return [];
  return renderZone(blocks, scenarioData, layout, theme);
}

export default function PreviewPane() {
  const state = useComposerState();
  const config = useActiveConfig();
  const surface = getSurfaceById(state.activeSurfaceId);
  const theme = getThemeById(config.themeId);

  if (!surface || !theme) return null;

  const scenarios = getScenariosBySurfaceId(state.activeSurfaceId);
  const labelWidth = Math.min(20, Math.max(...scenarios.map((s) => s.name.length)));
  const isMultiline = config.globalOptions["multiline"] === true;
  const promptChar = String(config.globalOptions["prompt-char"] ?? "❯");

  const defaultLayout = surface.defaultLayout;

  function getZoneLayout(zoneId: string) {
    return getLayoutForType(config.zones[zoneId]?.layout ?? defaultLayout);
  }

  return (
    <div className="flex flex-col">
      <div className="px-[1ch] py-3 text-text-muted uppercase outline-1 outline-border-muted">Preview</div>
      <div className="flex flex-col px-[2ch] py-3">
        {scenarios.map((scenario, si) => {
          const leftSpans = renderZoneSpans(config.zones["left-prompt"], scenario.data, getZoneLayout("left-prompt"), theme);
          const rightSpans = isZoneEnabled("right-prompt", config)
            ? renderZoneSpans(config.zones["right-prompt"], scenario.data, getZoneLayout("right-prompt"), theme)
            : [];
          const continuationSpans =
            scenario.data.multilineCommand && isZoneEnabled("continuation-prompt", config)
              ? renderZoneSpans(config.zones["continuation-prompt"], scenario.data, getZoneLayout("continuation-prompt"), theme)
              : [];

          return (
            <div key={scenario.id}>
              {/* Scenario row */}
              <div className="flex whitespace-nowrap overflow-x-auto">
                {/* Scenario label — fixed width matching longest label, truncate overflow */}
                <span
                  className="shrink-0 truncate text-text-muted mr-[1ch]"
                  style={{ width: `${labelWidth}ch` }}
                >
                  {scenario.name}
                </span>

                {isMultiline ? (
                  /* Multiline: two-line layout */
                  <div className="flex flex-col flex-1 min-w-0">
                    {/* Line 1: left content + right prompt */}
                    <div className="flex justify-between gap-[2ch]">
                      <span><SpanList spans={leftSpans} /></span>
                      {rightSpans.length > 0 && (
                        <span><SpanList spans={rightSpans} /></span>
                      )}
                    </div>
                    {/* Line 2: prompt char */}
                    <div>
                      <span className="text-text-secondary">{promptChar} </span>
                      <span className="text-text-muted opacity-50">█</span>
                    </div>
                  </div>
                ) : (
                  /* Single-line: left + prompt-char on left, right on right */
                  <div className="flex justify-between gap-[2ch] flex-1 min-w-0">
                    <span>
                      <SpanList spans={leftSpans} />
                      <span className="text-text-secondary"> {promptChar} </span>
                      <span className="text-text-muted opacity-50">█</span>
                    </span>
                    {rightSpans.length > 0 && (
                      <span><SpanList spans={rightSpans} /></span>
                    )}
                  </div>
                )}
              </div>

              {/* Continuation zone row (only for multilineCommand scenarios) */}
              {continuationSpans.length > 0 && (
                <div className="flex whitespace-nowrap overflow-x-auto">
                  <span className="shrink-0 mr-[1ch]" style={{ width: `${labelWidth}ch` }} />
                  <span>
                    <SpanList spans={continuationSpans} />
                  </span>
                </div>
              )}

              {/* Empty spacer between scenarios (not after last) */}
              {si < scenarios.length - 1 && <div className="h-[1lh]" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
