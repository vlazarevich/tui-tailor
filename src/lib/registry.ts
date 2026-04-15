import type { BlockDefinition } from './types'

const blocks: BlockDefinition[] = [
  {
    id: 'user',
    name: 'Username',
    category: 'essential',
    surfaces: ['terminal-prompt'],
    styles: {
      zen: { format: '{user}', icon: false },
      minimal: { format: '{user}', icon: false },
      extended: { format: '{user}', icon: true },
    },
    themeSlot: 'user',
    defaultStyle: 'minimal',
  },
  {
    id: 'host',
    name: 'Hostname',
    category: 'essential',
    surfaces: ['terminal-prompt'],
    styles: {
      zen: { format: '{host}', icon: false },
      minimal: { format: '{host}', icon: false },
      extended: { format: '{user}@{host}', icon: true },
    },
    themeSlot: 'host',
    defaultStyle: 'minimal',
  },
  {
    id: 'cwd',
    name: 'Directory',
    category: 'essential',
    surfaces: ['terminal-prompt'],
    styles: {
      zen: { format: '{dir}', icon: false },
      minimal: { format: '{dir}', icon: true },
      extended: { format: '{full_path}', icon: true },
    },
    themeSlot: 'path',
    defaultStyle: 'minimal',
  },
  {
    id: 'git-branch',
    name: 'Git Branch',
    category: 'git',
    surfaces: ['terminal-prompt'],
    styles: {
      zen: { format: '{branch}', icon: false },
      minimal: { format: ' {branch}', icon: true },
      extended: { format: ' {branch} {ahead}{behind}', icon: true },
    },
    themeSlot: 'vcs',
    defaultStyle: 'minimal',
  },
  {
    id: 'git-status',
    name: 'Git Status',
    category: 'git',
    surfaces: ['terminal-prompt'],
    styles: {
      zen: { format: '{dirty}', icon: false },
      minimal: { format: '{staged}{unstaged}{untracked}', icon: true },
      extended: { format: '+{staged} ~{unstaged} ?{untracked}', icon: true },
    },
    themeSlot: 'vcs',
    defaultStyle: 'minimal',
  },
  {
    id: 'exit-code',
    name: 'Exit Code',
    category: 'status',
    surfaces: ['terminal-prompt'],
    styles: {
      zen: { format: '{code}', icon: false },
      minimal: { format: '✗{code}', icon: true },
      extended: { format: '✗ exit:{code}', icon: true },
    },
    themeSlot: 'error',
    defaultStyle: 'minimal',
  },
  {
    id: 'time',
    name: 'Time',
    category: 'status',
    surfaces: ['terminal-prompt'],
    styles: {
      zen: { format: '{time}', icon: false },
      minimal: { format: '{time}', icon: true },
      extended: { format: '{time24}', icon: true },
    },
    themeSlot: 'info',
    defaultStyle: 'minimal',
  },
]

export const BLOCKS: BlockDefinition[] = blocks

export function getBlocksForSurface(surfaceId: string): BlockDefinition[] {
  return blocks.filter(b => b.surfaces.includes(surfaceId))
}

export function getBlocksByCategoryForSurface(surfaceId: string): Record<string, BlockDefinition[]> {
  const surfaceBlocks = getBlocksForSurface(surfaceId)
  const grouped: Record<string, BlockDefinition[]> = {}
  for (const block of surfaceBlocks) {
    if (!grouped[block.category]) {
      grouped[block.category] = []
    }
    grouped[block.category].push(block)
  }
  return grouped
}

export function getBlockById(id: string): BlockDefinition | undefined {
  return blocks.find(b => b.id === id)
}
