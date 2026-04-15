import type { SurfaceConfig } from './types'
import { DEFAULT_THEME_ID } from './themes'
import { DEFAULT_SURFACE_ID } from './surfaces'
import { createDefaultConfig, type ComposerState } from './composerContext'

const STORAGE_PREFIX = 'tui-tailor:'
const THEME_KEY = `${STORAGE_PREFIX}theme`
const ACTIVE_SURFACE_KEY = `${STORAGE_PREFIX}active-surface`

function surfaceKey(surfaceId: string): string {
  return `${STORAGE_PREFIX}${surfaceId}`
}

export function saveSurfaceConfig(config: SurfaceConfig): void {
  try {
    localStorage.setItem(surfaceKey(config.surfaceId), JSON.stringify(config))
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

export function loadSurfaceConfig(surfaceId: string): SurfaceConfig | null {
  try {
    const raw = localStorage.getItem(surfaceKey(surfaceId))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveThemeId(themeId: string): void {
  try {
    localStorage.setItem(THEME_KEY, themeId)
  } catch {
    // silently fail
  }
}

export function loadThemeId(): string {
  try {
    return localStorage.getItem(THEME_KEY) ?? DEFAULT_THEME_ID
  } catch {
    return DEFAULT_THEME_ID
  }
}

export function saveActiveSurface(surfaceId: string): void {
  try {
    localStorage.setItem(ACTIVE_SURFACE_KEY, surfaceId)
  } catch {
    // silently fail
  }
}

export function loadActiveSurface(): string {
  try {
    return localStorage.getItem(ACTIVE_SURFACE_KEY) ?? DEFAULT_SURFACE_ID
  } catch {
    return DEFAULT_SURFACE_ID
  }
}

export function loadInitialState(): ComposerState {
  const activeSurfaceId = loadActiveSurface()
  const savedConfig = loadSurfaceConfig(activeSurfaceId)
  const config = savedConfig ?? createDefaultConfig(activeSurfaceId)

  const themeId = loadThemeId()
  config.themeId = themeId

  return {
    activeSurfaceId,
    configs: { [activeSurfaceId]: config },
  }
}

// Base64 config string encode/decode

export function encodeConfig(config: SurfaceConfig): string {
  try {
    const json = JSON.stringify(config)
    return btoa(json)
  } catch {
    return ''
  }
}

export function decodeConfig(encoded: string): SurfaceConfig | null {
  try {
    const json = atob(encoded)
    const parsed = JSON.parse(json)
    if (!parsed.surfaceId || !parsed.zones) return null
    return parsed as SurfaceConfig
  } catch {
    return null
  }
}
