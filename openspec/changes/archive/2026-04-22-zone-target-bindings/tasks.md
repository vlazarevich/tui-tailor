## 1. Types

- [x] 1.1 In `src/lib/types.ts`, add `ZoneTargetBinding { slot: string; strategy?: string; [k: string]: unknown }`.
- [x] 1.2 Extend `ZoneDefinition` with `targetBindings: Record<TargetId, ZoneTargetBinding>`.

## 2. Populate bindings for the existing surface

- [x] 2.1 In `src/lib/data/surfaces.ts`, add `targetBindings` to each zone of `terminal-prompt`:
  - left-prompt → `{ "bash-ps1": { slot: "PS1" }, "powershell-prompt": { slot: "prompt-body" } }`
  - right-prompt → `{ "bash-ps1": { slot: "PS1", strategy: "ansi-cursor" }, "powershell-prompt": { slot: "rprompt" } }`
  - continuation-prompt → `{ "bash-ps1": { slot: "PS2" }, "powershell-prompt": { slot: "continuation" } }`

## 3. Bash target: slot handlers

- [x] 3.1 In `src/lib/exporters/bash.ts`, add `BashTarget.slots: Record<string, SlotHandler>` mapping `"PS1"`, `"PS2"` to existing emit logic. The `ansi-cursor` strategy for `PS1` dispatches to the current right-prompt cursor-positioning branch.
- [x] 3.2 Replace the hardcoded `const leftZone = config.zones["left-prompt"]` trio in `generatePromptSection` with a loop over `SURFACES[surfaceId].zones` that reads `targetBindings["bash-ps1"]` and dispatches to the matching slot handler.
- [x] 3.3 Remove the local `resolveLayout("left-prompt", …)` and similar ID-keyed helpers; zones arrive in surface order with their layout already resolved.

## 4. PowerShell target: slot handlers

- [x] 4.1 Same shape in `src/lib/exporters/powershell.ts`: declare slot handlers, loop surface zones, dispatch by binding.
- [x] 4.2 Move any remaining zone-ID comparisons into bindings.

## 5. Unknown-slot warnings

- [x] 5.1 Extend exporter result warnings (from phase 3) with a category for zone-slot mismatches.
- [x] 5.2 When a zone declares a binding to a slot the target adapter does not register, emit a warning with `{ zoneId, zoneName, slot }` and skip the zone.
- [x] 5.3 Update `ExportPopup.tsx` to render zone-slot warnings (reuse the existing warnings row).

## 6. Scrub hardcoded zone IDs

- [x] 6.1 `grep -n '"left-prompt"\|"right-prompt"\|"continuation-prompt"' src/lib/exporters/` returns no hits.
- [x] 6.2 Same grep in `src/lib/renderer.ts` / `src/lib/compose/` returns no hits other than data-file references (if any remain in tests, note them).

## 7. Verify

- [x] 7.1 Diff Bash exporter output against the golden fixtures from phase 3 — expect byte-identical output, because the single existing surface maps 1:1 onto its new bindings.
- [x] 7.2 Same for PowerShell.
- [x] 7.3 Dry-run adding a fake fourth zone to `terminal-prompt` with a binding to a new slot; confirm `unknown-slot` warning appears and the rest of the prompt renders.
