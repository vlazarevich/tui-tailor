import { useState } from 'react'
import { useActiveConfig, useComposerDispatch } from '../lib/composerContext'
import { encodeConfig, decodeConfig } from '../lib/persistence'

export default function ConfigShare() {
  const config = useActiveConfig()
  const dispatch = useComposerDispatch()
  const [importValue, setImportValue] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  function handleExport() {
    const encoded = encodeConfig(config)
    navigator.clipboard.writeText(encoded).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleImport() {
    setError('')
    const decoded = decodeConfig(importValue.trim())
    if (!decoded) {
      setError('Invalid config string')
      return
    }
    dispatch({ type: 'LOAD_CONFIG', config: decoded })
    setImportValue('')
  }

  return (
    <div className="outline outline-1 outline-border-primary">
      <div className="px-[1ch] py-0 bg-surface-secondary text-text-muted uppercase">
        Share
      </div>
      <div className="px-[1ch] py-0 flex flex-col">
        <button
          onClick={handleExport}
          className="px-[1ch] py-0 bg-surface-elevated outline outline-1 outline-border-primary text-text-secondary cursor-pointer hover:text-text-primary font-mono my-6"
        >
          {copied ? 'Copied!' : 'Copy config string'}
        </button>
        <div className="flex gap-[1ch] mb-6">
          <input
            type="text"
            placeholder="Paste config..."
            value={importValue}
            onChange={e => { setImportValue(e.target.value); setError('') }}
            className="flex-1 bg-surface-terminal outline outline-1 outline-border-primary text-text-primary px-[1ch] py-0 font-mono focus:outline-accent"
          />
          <button
            onClick={handleImport}
            disabled={!importValue.trim()}
            className="px-[1ch] py-0 bg-surface-elevated outline outline-1 outline-border-primary text-text-secondary cursor-pointer hover:text-text-primary disabled:opacity-30 disabled:cursor-default font-mono"
          >
            Load
          </button>
        </div>
        {error && <div className="text-semantic-error mb-6">{error}</div>}
      </div>
    </div>
  )
}
