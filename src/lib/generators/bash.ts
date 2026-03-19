import type { PromptConfig, SegmentId } from '../types'
import { hexToRgb } from '../utils'

const SEGMENT_VALUES: Record<SegmentId, string> = {
  user: '\\u',
  host: '\\h',
  cwd: '\\w',
  git_branch: '$(git branch --show-current 2>/dev/null)',
  exit_code: '$([ $? -ne 0 ] && echo "✗")',
}

function colorWrap(text: string, hex: string): string {
  const [r, g, b] = hexToRgb(hex)
  return `\\[\\e[38;2;${r};${g};${b}m\\]${text}\\[\\e[0m\\]`
}

export function generateBashConfig(config: PromptConfig): string {
  const parts = config.segments
    .filter(s => s.enabled)
    .map(s => colorWrap(SEGMENT_VALUES[s.id], s.color))
    .join(' ')

  return [
    '# Add to ~/.bashrc',
    `export PS1="${parts} $ "`,
  ].join('\n')
}
