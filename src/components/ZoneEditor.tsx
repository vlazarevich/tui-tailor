import { useState } from 'react'
import type { BlockInstance, ZoneDefinition } from '../lib/types'
import { getBlockById } from '../lib/registry'
import { useComposerDispatch } from '../lib/composerContext'

interface Props {
  zone: ZoneDefinition
  blocks: BlockInstance[]
}

export default function ZoneEditor({ zone, blocks }: Props) {
  const dispatch = useComposerDispatch()
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  function handleRemove(index: number) {
    dispatch({ type: 'REMOVE_BLOCK', zoneId: zone.id, index })
    if (expandedIndex === index) setExpandedIndex(null)
  }

  function handleMoveUp(index: number) {
    if (index === 0) return
    dispatch({ type: 'REORDER_BLOCK', zoneId: zone.id, fromIndex: index, toIndex: index - 1 })
    if (expandedIndex === index) setExpandedIndex(index - 1)
  }

  function handleMoveDown(index: number) {
    if (index >= blocks.length - 1) return
    dispatch({ type: 'REORDER_BLOCK', zoneId: zone.id, fromIndex: index, toIndex: index + 1 })
    if (expandedIndex === index) setExpandedIndex(index + 1)
  }

  function handleSetStyle(index: number, style: string) {
    dispatch({ type: 'SET_STYLE', zoneId: zone.id, index, style })
  }

  return (
    <div className="outline outline-1 outline-border-primary">
      <div className="px-[1ch] py-0 bg-surface-secondary text-text-muted uppercase">
        {zone.name}
      </div>
      {blocks.length === 0 ? (
        <div className="px-[1ch] py-6 text-text-muted text-center">
          No blocks — add from catalog
        </div>
      ) : (
        <div>
          {blocks.map((instance, i) => {
            const def = getBlockById(instance.blockId)
            if (!def) return null
            const isExpanded = expandedIndex === i

            return (
              <div key={`${instance.blockId}-${i}`}>
                <div className="flex items-center gap-[1ch] px-[1ch] py-0">
                  <button
                    onClick={() => setExpandedIndex(isExpanded ? null : i)}
                    className={`flex-1 text-left cursor-pointer text-semantic-${def.themeSlot}`}
                  >
                    {def.name}
                    <span className="text-text-muted ml-[1ch]">{instance.style}</span>
                  </button>
                  <div className="flex gap-[1ch] text-text-muted">
                    <button onClick={() => handleMoveUp(i)} disabled={i === 0} className="cursor-pointer hover:text-text-primary disabled:opacity-30 disabled:cursor-default">↑</button>
                    <button onClick={() => handleMoveDown(i)} disabled={i >= blocks.length - 1} className="cursor-pointer hover:text-text-primary disabled:opacity-30 disabled:cursor-default">↓</button>
                    <button onClick={() => handleRemove(i)} className="cursor-pointer hover:text-semantic-error">×</button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-[1ch] py-0 bg-surface-terminal">
                    <div className="text-text-muted">Style</div>
                    <div className="flex gap-[1ch]">
                      {Object.keys(def.styles).map(styleName => (
                        <button
                          key={styleName}
                          onClick={() => handleSetStyle(i, styleName)}
                          className={`px-[1ch] py-0 outline outline-1 cursor-pointer font-mono ${
                            instance.style === styleName
                              ? 'outline-accent text-accent bg-surface-elevated'
                              : 'outline-border-primary text-text-muted hover:text-text-secondary'
                          }`}
                        >
                          {styleName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
