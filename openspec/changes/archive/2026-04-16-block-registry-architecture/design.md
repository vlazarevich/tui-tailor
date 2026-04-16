## Context

The app shell and design system are complete (M1). The block registry currently holds 7 seed blocks in 3 categories (essential, git, status) with a flat-array architecture in `src/lib/registry.ts`. Blocks define format strings like `{branch}` and `{dir}` that reference scenario data directly, but nothing interprets them yet — the preview just shows block names as placeholders.

M2 requires a full terminal prompt block catalog and a rendering pipeline for live preview. During exploration, we discovered that different zone layout styles (plain, flow, brackets, powerline, powertab) need fundamentally different information from blocks — per-element colors, element roles, connector words — which a flat format-string model can't provide. This led to the element-based block model and four-stage rendering pipeline.

## Goals / Non-Goals

**Goals:**
- Refactor blocks from format strings to element-based definitions
- Build a four-stage rendering pipeline (emit → select → arrange → paint)
- Support five zone layout types with pluggable architecture
- Expand the block catalog to cover environment and cloud categories
- Define scenario data model with multiple presets per surface
- Support per-element theme sub-slots for fine-grained coloring

**Non-Goals:**
- Export code generation (M3 scope)
- Preview UI component (separate M2 task — this change provides the data pipeline it will consume)
- Additional surfaces beyond terminal-prompt (M4 scope)
- Custom user-defined blocks (M5 scope)
- Nerd font detection/warnings (future polish)

## Decisions

### 1. Three-layer block rendering: emit → select → arrange

Blocks don't produce text. They emit a bag of named elements from scenario data. Style presets select and order those elements. Zone layouts arrange and decorate the result. This separates data production (block), content selection (style), and visual presentation (layout) into independent concerns.

**Why:** A flat format-string model can't support the range of layout styles needed. Powerline needs per-block background colors. Flow needs connector words. Brackets need wrapping. Powertab needs to split icon from content. The element-based model gives layouts all the information they need without blocks knowing about layout details.

**Alternatives considered:** (a) Format strings with layout-specific escape codes — complex, couples blocks to layouts. (b) Per-layout format strings in each block — combinatorial explosion (5 layouts × 3 styles × 19 blocks).

### 2. Element roles as the contract between blocks and layouts

Each element declares a role: `content`, `icon`, or `connector`. Layouts use roles to apply different visual treatment — flow prepends connectors, powertab applies bg to icons only, plain ignores connectors. New layouts can be added by understanding these three roles without changing any block definitions.

**Why:** Roles are a stable, minimal interface. Blocks don't need to know which layouts exist. Layouts don't need to know element names — just roles.

### 3. Per-element theme sub-slots with parent fallback

Elements can specify their own theme slot (e.g., `vcs-ahead`) overriding the block's primary slot (`vcs`). If a theme doesn't define a sub-slot, it falls back to the parent. This gives theme authors the choice of uniform or differentiated block coloring.

**Why:** Users expect git ahead/behind/dirty to be distinguishable by color. But not all themes want to define 20+ sub-slots. The fallback chain (element slot → block slot) gives flexibility without requiring theme complexity.

### 4. Layout-specific color strategies

Each layout type owns its color assignment logic. Plain/flow/brackets use per-element fg colors. Powerline uses auto-contrast fg on block-colored bg, ignoring per-element slots. Powertab splits: icon region gets block bg + auto-contrast, content region gets per-element fg on default bg.

**Why:** Powerline's visual identity IS the colored ribbon — per-element colors would conflict with it. Making color strategy a layout concern keeps the model clean and each layout visually coherent.

### 5. Style templates produce structured spans, not flat strings

The select stage outputs an ordered list of spans preserving element boundaries and theme slots, not a joined string. This is necessary because the arrange stage needs to know where each element starts/ends and what color it wants.

**Why:** If select produced a flat string, the arrange stage would need to re-parse it to apply per-element colors. Structured output avoids lossy round-tripping.

### 6. Paint stage as separate concern

Theme resolution happens in a final paint stage, after layout arrangement. The arrange stage works with semantic color references ("vcs", "auto-contrast", "muted"), not hex values. Paint resolves these against the active theme.

**Why:** Keeps arrange logic theme-agnostic. Themes can be swapped without re-running the pipeline — only paint needs to re-execute. Also, auto-contrast depends on resolved bg, so paint must resolve bg before computing fg.

### 7. Scenario data as typed objects per surface

Each surface defines a scenario shape and named presets. For terminal-prompt: fields like `cwd`, `user`, `host`, `branch`, `dirty`, `nodeVersion`, etc. Presets include "Home Directory", "Git Repository", "Node Project", "Python Project", "Error State".

**Why:** Different surfaces need completely different scenario shapes. Typing them per surface catches missing fields at compile time. Presets give users realistic previews without manual input.

### 8. Keep the flat registry array

The registry remains a flat `BlockDefinition[]` array with helper functions. No plugin system or dynamic registration.

**Why:** Only ~20 blocks total for terminal-prompt. A plugin/dynamic system would be premature. Revisit when adding user-defined blocks in M5.

### 9. Flow layout — no position-aware connector logic

Flow layout always prepends a block's connector element if present, including the first block in a zone. No special-casing for first/middle/last position. If the first block has connector "on", the zone starts with "on" — block authors control this by choosing which blocks have connectors.

**Why:** Position-aware logic adds complexity and makes block arrangement order-sensitive in surprising ways. Simpler to let block definitions control it.

### 10. Separator vs. terminator in powerline/powertab

Separator glyphs appear between blocks. Terminator glyph appears after the last block only. They can differ (e.g., separator `` vs. terminator ``), but in most cases they're the same glyph.

**Why:** Classic powerline prompts end with a terminator that transitions from the last block's bg to the terminal default bg. It's visually distinct from inter-block separators.

### 11. Powertab fallback for blocks without icon

If a block has no icon-role element, powertab renders a fallback (empty string or space) wrapped in the colored tab with separator glyphs. The tab region still appears with the block's theme slot bg — it's just visually minimal.

**Why:** Consistent visual rhythm. Every block gets a colored tab even if there's no icon to show. Avoids layout breaking when mixing icon and non-icon blocks.

### 12. Flag element truthiness

Elements with flag-type formats (e.g., `dirty` with `format: "*"`) use strict boolean comparison (`=== true`) against the scenario field value, not JS truthiness. If the source value is not exactly `true`, the element resolves to empty string.

**Why:** Prevents surprising behavior with falsy-but-present values (0, "", null). Scenario data should be explicit.

### 13. Auto-contrast algorithm

The paint stage uses WCAG contrast ratio calculation to determine auto-contrast fg colors against resolved bg. Target: AA compliance (4.5:1 ratio minimum).

**Why:** Accessibility standard with well-defined math. Ensures readability across all theme color combinations.

### 14. Bracket padding is layout's concern

In brackets layout, any padding between content and brackets (e.g., `[ main ]` vs `[main]`) is controlled by the layout config, not by the style template. The template produces the inner content; the layout wraps it.

**Why:** Keeps style templates focused on element selection/ordering. Layout-specific spacing belongs in layout config.

### 15. Zone layout is user-selectable

Zone layout type is stored in `SurfaceConfig` (user state), not just in the surface definition. Users can change layout per zone, with an option to apply the same layout to all zones.

**Why:** Layout is a core visual preference, not a surface constraint. Users should be able to try different layouts without changing their block arrangement.

## Risks / Trade-offs

- **Element template complexity** — Style templates referencing element names add a level of indirection vs. flat format strings. Mitigation: the set of elements per block is small (3-6 typically) and documented in the block definition. Template syntax is identical to the old format strings, just referencing different names.
- **Scenario data maintenance** — Every new block might need a new scenario field, and all presets need updating. Mitigation: scenario presets provide sensible defaults; missing fields cause elements to resolve as empty, which is visually correct (block hides itself).
- **Layout implementation cost** — Five layout types is nontrivial. Mitigation: plain is trivial, flow/brackets are straightforward. Powerline/powertab are more complex but follow a known pattern. All share the same input contract (block spans + metadata).
- **Sub-slot proliferation** — Per-element theme slots could expand the theme surface significantly. Mitigation: sub-slots are optional and fall back to parent. Theme authors only define what they want to differentiate.
- **Flat array scaling** — Won't scale to hundreds of blocks. Mitigation: acceptable for M2-M4 scope (~30-50 blocks). Revisit if block count grows significantly.
