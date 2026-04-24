import type { SurfaceConfig, ZoneLayoutType } from "./types";

const VALID_LAYOUT_TYPES = new Set<ZoneLayoutType>(["plain", "flow", "brackets", "powerline", "powertab"]);

function migrateZones(zones: Record<string, unknown>): void {
  for (const [zoneId, value] of Object.entries(zones)) {
    const zone = value as Record<string, unknown>;
    // Migrate old format: zones were BlockInstance[], now ZoneConfig
    if (Array.isArray(zone)) {
      zones[zoneId] = { blocks: zone };
      continue;
    }
    // Migrate old format: layout was ZoneLayout object, now ZoneLayoutType string
    if (zone.layout && typeof zone.layout === "object") {
      const type = (zone.layout as Record<string, unknown>).type;
      zone.layout = VALID_LAYOUT_TYPES.has(type as ZoneLayoutType) ? type : undefined;
    }
  }
}
import { DEFAULT_THEME_ID } from "./data/themes";
import { DEFAULT_SURFACE_ID } from "./data/surfaces";
import { getBlockById } from "./data/blocks";
import { createDefaultConfig, type ComposerState } from "./composerContext";

function hasValidBlockIds(config: SurfaceConfig): boolean {
  for (const zone of Object.values(config.zones)) {
    if (!zone || !Array.isArray(zone.blocks)) continue;
    for (const inst of zone.blocks) {
      if (!getBlockById(inst.blockId)) return false;
    }
  }
  return true;
}

const STORAGE_PREFIX = "tui-tailor:";
const THEME_KEY = `${STORAGE_PREFIX}theme`;
const ACTIVE_SURFACE_KEY = `${STORAGE_PREFIX}active-surface`;

function surfaceKey(surfaceId: string): string {
  return `${STORAGE_PREFIX}${surfaceId}`;
}

export function saveSurfaceConfig(config: SurfaceConfig): void {
  try {
    localStorage.setItem(surfaceKey(config.surfaceId), JSON.stringify(config));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

export function loadSurfaceConfig(surfaceId: string): SurfaceConfig | null {
  try {
    const raw = localStorage.getItem(surfaceKey(surfaceId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Migrate old format: zones were Record<string, BlockInstance[]>, now Record<string, ZoneConfig>
    if (parsed.zones) migrateZones(parsed.zones);
    if (!hasValidBlockIds(parsed as SurfaceConfig)) {
      console.warn(`[tui-tailor] Discarding persisted config for ${surfaceId}: unknown block IDs`);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveThemeId(themeId: string): void {
  try {
    localStorage.setItem(THEME_KEY, themeId);
  } catch {
    // silently fail
  }
}

export function loadThemeId(): string {
  try {
    return localStorage.getItem(THEME_KEY) ?? DEFAULT_THEME_ID;
  } catch {
    return DEFAULT_THEME_ID;
  }
}

export function saveActiveSurface(surfaceId: string): void {
  try {
    localStorage.setItem(ACTIVE_SURFACE_KEY, surfaceId);
  } catch {
    // silently fail
  }
}

export function loadActiveSurface(): string {
  try {
    return localStorage.getItem(ACTIVE_SURFACE_KEY) ?? DEFAULT_SURFACE_ID;
  } catch {
    return DEFAULT_SURFACE_ID;
  }
}

export function loadInitialState(): ComposerState {
  const activeSurfaceId = loadActiveSurface();
  const savedConfig = loadSurfaceConfig(activeSurfaceId);
  const config = savedConfig ?? createDefaultConfig(activeSurfaceId);

  const themeId = loadThemeId();
  config.themeId = themeId;

  return {
    activeSurfaceId,
    configs: { [activeSurfaceId]: config },
  };
}

// Base64 config string encode/decode

export function encodeConfig(config: SurfaceConfig): string {
  try {
    const json = JSON.stringify(config);
    return btoa(encodeURIComponent(json));
  } catch {
    return "";
  }
}

export function decodeConfig(encoded: string): SurfaceConfig | null {
  try {
    const json = decodeURIComponent(atob(encoded));
    const parsed = JSON.parse(json);
    if (!parsed.surfaceId || !parsed.zones) return null;
    migrateZones(parsed.zones);
    if (!hasValidBlockIds(parsed as SurfaceConfig)) {
      console.warn(`[tui-tailor] Rejecting imported config: unknown block IDs`);
      return null;
    }
    return parsed as SurfaceConfig;
  } catch {
    return null;
  }
}
