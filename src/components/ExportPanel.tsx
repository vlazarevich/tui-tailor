import { useState } from "react";
import { useActiveConfig, useComposerDispatch } from "../lib/composerContext";
import { encodeConfig, decodeConfig } from "../lib/persistence";

export default function ExportPanel() {
  const config = useActiveConfig();
  const dispatch = useComposerDispatch();
  const [importValue, setImportValue] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  function handleExport() {
    const encoded = encodeConfig(config);
    navigator.clipboard.writeText(encoded).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleImport() {
    setError("");
    const decoded = decodeConfig(importValue.trim());
    if (!decoded) {
      setError("Invalid config string");
      return;
    }
    dispatch({ type: "LOAD_CONFIG", config: decoded });
    setImportValue("");
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="outline-1 outline-border-primary mx-[2ch] mt-3">
        <div className="px-[1ch] py-0 bg-surface-secondary text-text-muted uppercase">Share</div>
        <div className="px-[1ch] py-0 flex flex-col">
          <button
            onClick={handleExport}
            className="px-[1ch] py-0 bg-surface-elevated outline-1 outline-border-primary text-text-secondary cursor-pointer hover:text-text-primary font-mono my-[1lh]"
          >
            {copied ? "Copied!" : "Copy config string"}
          </button>
          <textarea
            placeholder="Paste config..."
            value={importValue}
            rows={5}
            onChange={(e) => {
              setImportValue(e.target.value);
              setError("");
            }}
            className="w-full bg-surface-terminal outline-1 outline-border-primary text-text-primary px-[1ch] py-0 font-mono focus:outline-accent resize-none mb-[1lh]"
          />
          <button
            onClick={handleImport}
            disabled={!importValue.trim()}
            className="w-full px-[1ch] py-0 bg-surface-elevated outline-1 outline-border-primary text-text-secondary cursor-pointer hover:text-text-primary disabled:opacity-30 disabled:cursor-default font-mono mb-6"
          >
            Load
          </button>
          {error && <div className="text-semantic-error mb-[1lh]">{error}</div>}
        </div>
      </div>

      <div className="mx-[2ch] mt-[1lh] outline-1 outline-border-primary">
        <div className="px-[1ch] py-0 bg-surface-secondary text-text-muted uppercase">Export</div>
        <div className="px-[1ch] py-[1lh] text-text-muted text-center">Export targets coming soon</div>
      </div>
    </div>
  );
}
