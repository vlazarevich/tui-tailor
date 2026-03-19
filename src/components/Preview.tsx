import type { PromptConfig, SegmentId } from '../lib/types'

const PREVIEW_VALUES: Record<SegmentId, string> = {
  user: 'user',
  host: 'machine',
  cwd: '~/projects',
  git_branch: 'main',
  exit_code: '✗',
}

interface Props {
  config: PromptConfig
}

export default function Preview({ config }: Props) {
  const segments = config.segments.filter(s => s.enabled)

  return (
    <div className="preview">
      <h2>Preview</h2>
      <div className="terminal-line">
        {segments.map((seg, i) => (
          <span key={seg.id} style={{ color: seg.color }}>
            {PREVIEW_VALUES[seg.id]}
            {i < segments.length - 1 ? ' ' : ''}
          </span>
        ))}
        <span className="prompt-char"> $ </span>
      </div>
    </div>
  )
}
