import { createContext, useContext, type Dispatch } from "react";
import type { SurfaceConfig, ZoneConfig, ZoneLayoutType } from "./types";
import { getSurfaceById } from "./data/surfaces";
import { DEFAULT_THEME_ID } from "./data/themes";

export interface ComposerState {
  activeSurfaceId: string;
  configs: Record<string, SurfaceConfig>;
}

type Action =
  | { type: "ADD_BLOCK"; zoneId: string; blockId: string; style: string }
  | { type: "REMOVE_BLOCK"; zoneId: string; index: number }
  | { type: "REORDER_BLOCK"; zoneId: string; fromIndex: number; toIndex: number }
  | { type: "MOVE_BLOCK_TO_ZONE"; fromZoneId: string; index: number; toZoneId: string }
  | { type: "SET_STYLE"; zoneId: string; index: number; style: string }
  | { type: "SET_ZONE_LAYOUT"; zoneId: string; layout: ZoneLayoutType }
  | { type: "SET_ALL_ZONES_LAYOUT"; layout: ZoneLayoutType }
  | { type: "SET_THEME"; themeId: string }
  | { type: "SWITCH_SURFACE"; surfaceId: string }
  | { type: "SET_GLOBAL_OPTION"; key: string; value: string | boolean }
  | { type: "LOAD_CONFIG"; config: SurfaceConfig }
  | { type: "ENABLE_ZONE"; zoneId: string }
  | { type: "DISABLE_ZONE"; zoneId: string };

export type ComposerAction = Action;

function getActiveConfig(state: ComposerState): SurfaceConfig {
  return state.configs[state.activeSurfaceId] ?? createDefaultConfig(state.activeSurfaceId);
}

export function isZoneEnabled(zoneId: string, config: SurfaceConfig): boolean {
  const surface = getSurfaceById(config.surfaceId);
  if (!surface) return false;
  const zoneDef = surface.zones.find((z) => z.id === zoneId);
  if (!zoneDef) return false;
  if (!zoneDef.optional) return true;
  return config.zones[zoneId]?.enabled !== false;
}

export function createDefaultConfig(surfaceId: string): SurfaceConfig {
  const surface = getSurfaceById(surfaceId);
  const zones: Record<string, ZoneConfig> = {};
  const globalOptions: Record<string, string | boolean> = {};
  if (surface) {
    for (const zone of surface.zones) {
      zones[zone.id] = { blocks: [] };
    }
    for (const opt of surface.globalOptions) {
      globalOptions[opt.id] = opt.defaultValue;
    }
  }
  return { surfaceId, zones, globalOptions, themeId: DEFAULT_THEME_ID };
}

export function composerReducer(state: ComposerState, action: Action): ComposerState {
  const config = getActiveConfig(state);

  function updateConfig(patch: Partial<SurfaceConfig>): ComposerState {
    return {
      ...state,
      configs: {
        ...state.configs,
        [state.activeSurfaceId]: { ...config, ...patch },
      },
    };
  }

  switch (action.type) {
    case "ADD_BLOCK": {
      const zoneConfig = config.zones[action.zoneId] ?? { blocks: [] };
      const blocks = [...zoneConfig.blocks, { blockId: action.blockId, style: action.style }];
      return updateConfig({
        zones: { ...config.zones, [action.zoneId]: { ...zoneConfig, blocks } },
      });
    }
    case "REMOVE_BLOCK": {
      const zoneConfig = config.zones[action.zoneId] ?? { blocks: [] };
      const blocks = [...zoneConfig.blocks];
      blocks.splice(action.index, 1);
      return updateConfig({ zones: { ...config.zones, [action.zoneId]: { ...zoneConfig, blocks } } });
    }
    case "REORDER_BLOCK": {
      const zoneConfig = config.zones[action.zoneId] ?? { blocks: [] };
      const blocks = [...zoneConfig.blocks];
      const [item] = blocks.splice(action.fromIndex, 1);
      blocks.splice(action.toIndex, 0, item);
      return updateConfig({ zones: { ...config.zones, [action.zoneId]: { ...zoneConfig, blocks } } });
    }
    case "MOVE_BLOCK_TO_ZONE": {
      const fromZone = config.zones[action.fromZoneId] ?? { blocks: [] };
      const toZone = config.zones[action.toZoneId] ?? { blocks: [] };
      const fromBlocks = [...fromZone.blocks];
      const [moved] = fromBlocks.splice(action.index, 1);
      const toBlocks = [...toZone.blocks, moved];
      return updateConfig({
        zones: {
          ...config.zones,
          [action.fromZoneId]: { ...fromZone, blocks: fromBlocks },
          [action.toZoneId]: { ...toZone, blocks: toBlocks },
        },
      });
    }
    case "SET_STYLE": {
      const zoneConfig = config.zones[action.zoneId] ?? { blocks: [] };
      const blocks = [...zoneConfig.blocks];
      if (blocks[action.index]) {
        blocks[action.index] = { ...blocks[action.index], style: action.style };
      }
      return updateConfig({ zones: { ...config.zones, [action.zoneId]: { ...zoneConfig, blocks } } });
    }
    case "SET_ZONE_LAYOUT": {
      const zoneConfig = config.zones[action.zoneId] ?? { blocks: [] };
      return updateConfig({
        zones: { ...config.zones, [action.zoneId]: { ...zoneConfig, layout: action.layout } },
      });
    }
    case "SET_ALL_ZONES_LAYOUT": {
      const updatedZones: Record<string, ZoneConfig> = {};
      for (const [zoneId, zoneConfig] of Object.entries(config.zones)) {
        updatedZones[zoneId] = { ...zoneConfig, layout: action.layout };
      }
      return updateConfig({ zones: updatedZones });
    }
    case "SET_THEME": {
      return updateConfig({ themeId: action.themeId });
    }
    case "SWITCH_SURFACE": {
      const existing = state.configs[action.surfaceId];
      return {
        ...state,
        activeSurfaceId: action.surfaceId,
        configs: existing
          ? state.configs
          : { ...state.configs, [action.surfaceId]: createDefaultConfig(action.surfaceId) },
      };
    }
    case "SET_GLOBAL_OPTION": {
      return updateConfig({ globalOptions: { ...config.globalOptions, [action.key]: action.value } });
    }
    case "LOAD_CONFIG": {
      return {
        ...state,
        activeSurfaceId: action.config.surfaceId,
        configs: { ...state.configs, [action.config.surfaceId]: action.config },
      };
    }
    case "ENABLE_ZONE": {
      const zoneConfig = config.zones[action.zoneId] ?? { blocks: [] };
      return updateConfig({
        zones: { ...config.zones, [action.zoneId]: { ...zoneConfig, enabled: true } },
      });
    }
    case "DISABLE_ZONE": {
      const zoneConfig = config.zones[action.zoneId] ?? { blocks: [] };
      return updateConfig({
        zones: { ...config.zones, [action.zoneId]: { ...zoneConfig, enabled: false } },
      });
    }
    default:
      return state;
  }
}

export const ComposerStateContext = createContext<ComposerState | null>(null);
export const ComposerDispatchContext = createContext<Dispatch<Action> | null>(null);

export function useComposerState(): ComposerState {
  const ctx = useContext(ComposerStateContext);
  if (!ctx) throw new Error("useComposerState must be used within ComposerProvider");
  return ctx;
}

export function useComposerDispatch(): Dispatch<Action> {
  const ctx = useContext(ComposerDispatchContext);
  if (!ctx) throw new Error("useComposerDispatch must be used within ComposerProvider");
  return ctx;
}

export function useActiveConfig(): SurfaceConfig {
  const state = useComposerState();
  return state.configs[state.activeSurfaceId] ?? createDefaultConfig(state.activeSurfaceId);
}

