import { useComposerState, useActiveConfig, useComposerDispatch } from '../lib/composerContext'
import { getSurfaceById } from '../lib/surfaces'
import ZoneEditor from './ZoneEditor'

export default function Canvas() {
  const state = useComposerState()
  const config = useActiveConfig()
  const dispatch = useComposerDispatch()
  const surface = getSurfaceById(state.activeSurfaceId)

  if (!surface) {
    return <div className="text-text-muted px-[2ch] py-6">No surface selected</div>
  }

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto px-[2ch] py-3">
      <div className="flex flex-col gap-6">
        {surface.zones.map(zone => (
          <ZoneEditor
            key={zone.id}
            zone={zone}
            blocks={config.zones[zone.id] ?? []}
          />
        ))}
      </div>

      {surface.globalOptions.length > 0 && (
        <div className="outline outline-1 outline-border-primary">
          <div className="px-[1ch] py-0 bg-surface-secondary text-text-muted uppercase">
            Options
          </div>
          <div className="px-[1ch] py-0 flex flex-col">
            {surface.globalOptions.map(opt => (
              <div key={opt.id} className="flex items-center gap-[1ch]">
                {opt.type === 'boolean' ? (
                  <>
                    <input
                      type="checkbox"
                      id={opt.id}
                      checked={config.globalOptions[opt.id] === true}
                      onChange={e => dispatch({ type: 'SET_GLOBAL_OPTION', key: opt.id, value: e.target.checked })}
                      className="cursor-pointer"
                    />
                    <label htmlFor={opt.id} className="text-text-secondary cursor-pointer">{opt.name}</label>
                  </>
                ) : (
                  <>
                    <label htmlFor={opt.id} className="text-text-secondary">{opt.name}</label>
                    <input
                      type="text"
                      id={opt.id}
                      value={String(config.globalOptions[opt.id] ?? '')}
                      onChange={e => dispatch({ type: 'SET_GLOBAL_OPTION', key: opt.id, value: e.target.value })}
                      className="bg-surface-terminal outline outline-1 outline-border-primary text-text-primary px-[1ch] py-0 font-mono w-[8ch] focus:outline-accent"
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
