import { useState } from 'react'
import type { PromptConfig } from '../lib/types'
import { generateBashConfig } from '../lib/generators/bash'
import { generatePowerShellConfig } from '../lib/generators/powershell'

interface Props {
  config: PromptConfig
}

export default function ConfigOutput({ config }: Props) {
  const [copied, setCopied] = useState(false)

  const output = config.shell === 'bash'
    ? generateBashConfig(config)
    : generatePowerShellConfig(config)

  function handleCopy() {
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="config-output">
      <h2>Config</h2>
      <pre>{output}</pre>
      <button onClick={handleCopy}>{copied ? 'Copied!' : 'Copy'}</button>
    </div>
  )
}
