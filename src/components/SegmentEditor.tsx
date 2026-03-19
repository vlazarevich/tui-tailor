import type { Segment } from '../lib/types'

interface Props {
  segments: Segment[]
  onToggle: (id: string) => void
  onColorChange: (id: string, color: string) => void
}

export default function SegmentEditor({ segments, onToggle, onColorChange }: Props) {
  return (
    <div className="segment-editor">
      <h2>Segments</h2>
      {segments.map(seg => (
        <div key={seg.id} className="segment-row">
          <input
            type="checkbox"
            id={seg.id}
            checked={seg.enabled}
            onChange={() => onToggle(seg.id)}
          />
          <label htmlFor={seg.id}>{seg.label}</label>
          <input
            type="color"
            value={seg.color}
            disabled={!seg.enabled}
            onChange={e => onColorChange(seg.id, e.target.value)}
          />
        </div>
      ))}
    </div>
  )
}
