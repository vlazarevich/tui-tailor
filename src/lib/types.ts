export type Shell = 'bash' | 'powershell'

export type SegmentId = 'user' | 'host' | 'cwd' | 'git_branch' | 'exit_code'

export interface Segment {
  id: SegmentId
  label: string
  enabled: boolean
  color: string // hex, e.g. '#98c379'
}

export interface PromptConfig {
  shell: Shell
  segments: Segment[]
}
