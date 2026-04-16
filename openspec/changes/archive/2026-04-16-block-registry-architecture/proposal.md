## Why

The current block registry has 7 seed blocks across 3 categories (essential, git, status), sufficient to demo the app shell but not to build real prompts. M2 requires a full terminal prompt block catalog with environment and cloud categories, plus a rendering pipeline that turns block definitions into preview-ready output. The current flat format-string model (blocks produce a single text string) cannot support the range of zone layout styles needed — powerline ribbons, bracket wrapping, text flow with connectors — so the architecture needs to shift to an element-based model where blocks emit named data elements and layouts arrange them.

## What Changes

- Refactor block definitions from flat format strings to **named element maps** — each block emits typed elements (content, icon, connector) with per-element theme slots
- Refactor style presets from scenario-token format strings to **element template strings** that reference block elements
- Add a **four-stage rendering pipeline**: Emit (elements from scenario) → Select (style template picks and orders elements) → Arrange (zone layout decorates and combines) → Paint (theme resolves colors)
- Add **five zone layout types**: plain, flow, brackets, powerline, powertab — each with layout-specific color strategies
- Add **per-element theme sub-slots** (e.g., `vcs-ahead`, `vcs-behind`) with parent fallback
- Add environment blocks: `node-version`, `python-version`, `ruby-version`, `golang-version`, `rust-version`, `java-version`
- Add cloud blocks: `aws-profile`, `azure-subscription`, `gcp-project`, `kubernetes-context`
- Add missing status blocks: `jobs`, `cmd-duration`
- Introduce **scenario data model**: typed context objects that blocks emit elements from, with 5+ presets per surface
- Expand category labels and ordering in the catalog

## Capabilities

### New Capabilities
- `block-rendering`: Four-stage pipeline (emit/select/arrange/paint) that transforms block element definitions through zone layouts into themed render spans for preview

### Modified Capabilities
- `block-registry`: Refactoring block definitions to element-based model, adding new blocks (environment, cloud, status), per-element theme sub-slots, category ordering, zone layout configuration

## Impact

- `src/lib/types.ts` — new types: ElementDefinition, BlockDefinition (refactored), RenderSpan, ZoneLayout, ScenarioData
- `src/lib/registry.ts` — all block definitions refactored to element-based model, new blocks added
- New `src/lib/renderer.ts` — four-stage rendering pipeline (emit, select, arrange, paint)
- New `src/lib/scenarios.ts` — scenario presets per surface
- `src/lib/surfaces.ts` — zone layout defaults
- `src/lib/themes.ts` — theme sub-slot support with parent fallback
- `src/components/BlockCatalog.tsx` — new category labels, ordered categories
- New preview component will consume rendered output (but building the preview UI is M2-preview scope, not this change)
