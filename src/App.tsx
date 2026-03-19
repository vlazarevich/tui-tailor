import { useState } from 'react'
import type { PromptConfig, Segment, Shell } from './lib/types'
import ToolSelector from './components/ToolSelector'
import SegmentEditor from './components/SegmentEditor'
import Preview from './components/Preview'
import ConfigOutput from './components/ConfigOutput'

const DEFAULT_SEGMENTS: Segment[] = [
  { id: 'user',       label: 'User',       enabled: true,  color: '#98c379' },
  { id: 'host',       label: 'Host',       enabled: true,  color: '#61afef' },
  { id: 'cwd',        label: 'Directory',  enabled: true,  color: '#e5c07b' },
  { id: 'git_branch', label: 'Git Branch', enabled: true,  color: '#c678dd' },
  { id: 'exit_code',  label: 'Exit Code',  enabled: false, color: '#e06c75' },
]

export default function App() {
  const [shell, setShell] = useState<Shell>('bash')
  const [segments, setSegments] = useState<Segment[]>(DEFAULT_SEGMENTS)

  const config: PromptConfig = { shell, segments }

  function toggleSegment(id: string) {
    setSegments(segs => segs.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s))
  }

  function updateColor(id: string, color: string) {
    setSegments(segs => segs.map(s => s.id === id ? { ...s, color } : s))
  }

  return (
    <div className="app">
      <header>
        <h1>tui-tailor</h1>
        <ToolSelector shell={shell} onChange={setShell} />
      </header>
      <main>
        <SegmentEditor
          segments={segments}
          onToggle={toggleSegment}
          onColorChange={updateColor}
        />
        <div className="right-panel">
          <Preview config={config} />
          <ConfigOutput config={config} />
        </div>
      </main>
    </div>
  )
}
