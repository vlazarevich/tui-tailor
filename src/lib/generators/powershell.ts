import type { PromptConfig, SegmentId } from '../types'
import { hexToRgb } from '../utils'

// $($e) expands the $e variable inside a double-quoted PS string
const SEGMENT_VALUES: Record<SegmentId, string> = {
  user: '$env:USERNAME',
  host: '$env:COMPUTERNAME',
  cwd: '$(Get-Location)',
  git_branch: '$(git branch --show-current 2>$null)',
  exit_code: "$(if ($LASTEXITCODE) { '✗' })",
}

function colorWrap(expr: string, hex: string): string {
  const [r, g, b] = hexToRgb(hex)
  return '"$($e)[38;2;' + r + ';' + g + ';' + b + 'm' + expr + '$($e)[0m "'
}

export function generatePowerShellConfig(config: PromptConfig): string {
  const lines = config.segments
    .filter(s => s.enabled)
    .map(s => `    Write-Host -NoNewline ${colorWrap(SEGMENT_VALUES[s.id], s.color)}`)

  return [
    '# Add to your PowerShell profile (run: notepad $PROFILE)',
    'function Prompt {',
    '    $e = [char]27',
    ...lines,
    '    return "$ "',
    '}',
  ].join('\n')
}
