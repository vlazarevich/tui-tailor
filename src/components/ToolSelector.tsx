import type { Shell } from '../lib/types'

interface Props {
  shell: Shell
  onChange: (shell: Shell) => void
}

export default function ToolSelector({ shell, onChange }: Props) {
  return (
    <div className="tool-selector">
      {(['bash', 'powershell'] as Shell[]).map(s => (
        <button
          key={s}
          className={shell === s ? 'active' : ''}
          onClick={() => onChange(s)}
        >
          {s === 'bash' ? 'Bash' : 'PowerShell'}
        </button>
      ))}
    </div>
  )
}
