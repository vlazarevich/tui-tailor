import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react'
import type { BlockInstance, SurfaceConfig } from './types'
import { getSurfaceById } from './surfaces'
import { DEFAULT_THEME_ID } from './themes'

export interface ComposerState {
  activeSurfaceId: string
  configs: Record<string, SurfaceConfig>
}

type Action =
  | { type: 'ADD_BLOCK'; zoneId: string; blockId: string; style: string }
  | { type: 'REMOVE_BLOCK'; zoneId: string; index: number }
  | { type: 'REORDER_BLOCK'; zoneId: string; fromIndex: number; toIndex: number }
  | { type: 'SET_STYLE'; zoneId: string; index: number; style: string }
  | { type: 'SET_THEME'; themeId: string }
  | { type: 'SWITCH_SURFACE'; surfaceId: string }
  | { type: 'SET_GLOBAL_OPTION'; key: string; value: string | boolean }
  | { type: 'LOAD_CONFIG'; config: SurfaceConfig }

export type ComposerAction = Action

function getActiveConfig(state: ComposerState): SurfaceConfig {
  return state.configs[state.activeSurfaceId] ?? createDefaultConfig(state.activeSurfaceId)
}

export function createDefaultConfig(surfaceId: string): SurfaceConfig {
  const surface = getSurfaceById(surfaceId)
  const zones: Record<string, BlockInstance[]> = {}
  const globalOptions: Record<string, string | boolean> = {}
  if (surface) {
    for (const zone of surface.zones) {
      zones[zone.id] = []
    }
    for (const opt of surface.globalOptions) {
      globalOptions[opt.id] = opt.defaultValue
    }
  }
  return { surfaceId, zones, globalOptions, themeId: DEFAULT_THEME_ID }
}

function composerReducer(state: ComposerState, action: Action): ComposerState {
  const config = getActiveConfig(state)

  function updateConfig(patch: Partial<SurfaceConfig>): ComposerState {
    return {
      ...state,
      configs: {
        ...state.configs,
        [state.activeSurfaceId]: { ...config, ...patch },
      },
    }
  }

  switch (action.type) {
    case 'ADD_BLOCK': {
      const zone = config.zones[action.zoneId] ?? []
      return updateConfig({
        zones: { ...config.zones, [action.zoneId]: [...zone, { blockId: action.blockId, style: action.style }] },
      })
    }
    case 'REMOVE_BLOCK': {
      const zone = [...(config.zones[action.zoneId] ?? [])]
      zone.splice(action.index, 1)
      return updateConfig({ zones: { ...config.zones, [action.zoneId]: zone } })
    }
    case 'REORDER_BLOCK': {
      const zone = [...(config.zones[action.zoneId] ?? [])]
      const [item] = zone.splice(action.fromIndex, 1)
      zone.splice(action.toIndex, 0, item)
      return updateConfig({ zones: { ...config.zones, [action.zoneId]: zone } })
    }
    case 'SET_STYLE': {
      const zone = [...(config.zones[action.zoneId] ?? [])]
      if (zone[action.index]) {
        zone[action.index] = { ...zone[action.index], style: action.style }
      }
      return updateConfig({ zones: { ...config.zones, [action.zoneId]: zone } })
    }
    case 'SET_THEME': {
      return updateConfig({ themeId: action.themeId })
    }
    case 'SWITCH_SURFACE': {
      const existing = state.configs[action.surfaceId]
      return {
        ...state,
        activeSurfaceId: action.surfaceId,
        configs: existing
          ? state.configs
          : { ...state.configs, [action.surfaceId]: createDefaultConfig(action.surfaceId) },
      }
    }
    case 'SET_GLOBAL_OPTION': {
      return updateConfig({ globalOptions: { ...config.globalOptions, [action.key]: action.value } })
    }
    case 'LOAD_CONFIG': {
      return {
        ...state,
        activeSurfaceId: action.config.surfaceId,
        configs: { ...state.configs, [action.config.surfaceId]: action.config },
      }
    }
    default:
      return state
  }
}

const ComposerStateContext = createContext<ComposerState | null>(null)
const ComposerDispatchContext = createContext<Dispatch<Action> | null>(null)

export function ComposerProvider({ initialState, children }: { initialState: ComposerState; children: ReactNode }) {
  const [state, dispatch] = useReducer(composerReducer, initialState)
  return (
    <ComposerStateContext value={state}>
      <ComposerDispatchContext value={dispatch}>
        {children}
      </ComposerDispatchContext>
    </ComposerStateContext>
  )
}

export function useComposerState(): ComposerState {
  const ctx = useContext(ComposerStateContext)
  if (!ctx) throw new Error('useComposerState must be used within ComposerProvider')
  return ctx
}

export function useComposerDispatch(): Dispatch<Action> {
  const ctx = useContext(ComposerDispatchContext)
  if (!ctx) throw new Error('useComposerDispatch must be used within ComposerProvider')
  return ctx
}

export function useActiveConfig(): SurfaceConfig {
  const state = useComposerState()
  return state.configs[state.activeSurfaceId] ?? createDefaultConfig(state.activeSurfaceId)
}
