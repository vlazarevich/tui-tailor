export interface StylePreset {
  format: string
  icon: boolean
}

export interface BlockDefinition {
  id: string
  name: string
  category: string
  surfaces: string[]
  styles: Record<string, StylePreset>
  themeSlot: string
  defaultStyle: string
}

export interface BlockInstance {
  blockId: string
  style: string
}

export interface ZoneDefinition {
  id: string
  name: string
}

export interface GlobalOptionDefinition {
  id: string
  name: string
  type: 'boolean' | 'string'
  defaultValue: string | boolean
}

export interface Surface {
  id: string
  name: string
  zones: ZoneDefinition[]
  globalOptions: GlobalOptionDefinition[]
}

export interface SurfaceConfig {
  surfaceId: string
  zones: Record<string, BlockInstance[]>
  globalOptions: Record<string, string | boolean>
  themeId: string
}

export type ExportTargetId = string

export interface ExportTarget {
  id: ExportTargetId
  name: string
  surfaceId: string
}
