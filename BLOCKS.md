# Blocks Registry

Canonical block catalog for the **terminal prompt** surface in `tui-tailor`, derived by
merging and curating [Starship modules](https://starship.rs/config/) and
[Oh My Posh segments](https://ohmyposh.dev/docs/configuration/segment).

Each block entry below defines: category, what it shows, render conditions, style presets,
and one rendered example per preset. Entries intentionally omitted from scope are collected
under **Out of scope** at the end of the document.

---

## Totals

**30 blocks** across 5 categories:

- **Essentials** (2) — `session`, `cwd`
- **VCS** (1) — `git`
- **Status** (5) — `last-command`, `sudo`, `jobs`, `clock`, `sysinfo`
- **Languages** (14) — `node`, `python`, `ruby`, `go`, `rust`, `java`, `kotlin`, `scala`,
  `dotnet`, `php`, `lua`, `swift`, `dart`, `elixir`
- **Cloud** (8) — `aws`, `azure`, `gcp`, `kubernetes`, `docker`, `helm`, `terraform`, `pulumi`

---

## Block specifications

### `session`

- **Category:** `essential`
- **Shows:** Consolidated identity/environment — user, host, shell, OS, any subset.
- **Sources:** Starship `username` + `hostname` + `shell` + `os` · OMP `session` (user+host)

**Conditions**

- Always renders when enabled. Individual fields that resolve to empty are omitted from the
  rendered output (e.g. `shell` unknown → skipped, rest still shows).

**Style presets**

| Preset       | Example                     |
| ------------ | --------------------------- |
| `user-only`  | `viktor`                    |
| `host-only`  | `thinkpad`                  |
| `shell-only` | `zsh`                       |
| `os-only`    | ` arch`                     |
| `user@host`  | `viktor@thinkpad`           |
| `shell+os`   | `zsh on  arch`              |
| `all`        | `viktor@thinkpad  arch zsh` |

---

### `cwd` (display name: "Directory")

- **Category:** `essential`
- **Shows:** Current working directory, with configurable contraction/truncation.
- **Sources:** Starship `directory` · OMP `path`

**Conditions**

- Always renders. Truncation kicks in only when the path exceeds N segments; shorter paths
  render in full even under `short-3` / `short-5`.

**Style presets**

| Preset     | Example                            |
| ---------- | ---------------------------------- |
| `absolute` | `/home/viktor/projects/tui-tailor` |
| `tilde`    | `~/projects/tui-tailor`            |
| `short-3`  | `…/projects/tui-tailor`            |
| `short-5`  | `~/projects/tui-tailor`            |

(`short-5` resolves to the tilde form here because the path only has 3 segments after `$HOME`.)

---

### `git`

- **Category:** `vcs`
- **Shows:** Branch name, upstream divergence, working-tree state, and (at max) line churn.
- **Sources:** Starship `git_branch` + `git_status` + `git_state` + `git_metrics` + `git_commit` · OMP `git`

**Conditions**

- Renders only when cwd is inside a git work tree (`git rev-parse --is-inside-work-tree` succeeds).
- **Detached HEAD:** branch field substitutes with short commit hash (e.g. `@a1b2c3d`).
- **In-progress op** (rebase, merge, cherry-pick, bisect): only shown in `full` / `max`,
  appended to the branch as `main|REBASE 2/5`.
- `*` (dirty marker) shown only in `minimal` / `medium`; in `full` / `max` the explicit
  counts make it redundant.
- Numeric fields collapse silently when zero (e.g. no behind commits → `↓0` is omitted).

**Symbol legend**

| Symbol  | Meaning               |
| ------- | --------------------- |
| `*`     | working tree dirty    |
| `↑N`    | commits ahead         |
| `↓N`    | commits behind        |
| `+N`    | staged                |
| `~N`    | modified (unstaged)   |
| `-N`    | deleted               |
| `»N`    | renamed               |
| `?N`    | untracked             |
| `+N/-N` | lines added / removed |

**Style presets**

| Preset    | Example                          |
| --------- | -------------------------------- |
| `minimal` | ` main *`                        |
| `medium`  | ` main ↑2↓1 *`                   |
| `full`    | ` main ↑2↓1 +3~2-1»1?4`          |
| `max`     | ` main ↑2↓1 +3~2-1»1?4 +142/-37` |

---

### `last-command`

- **Category:** `status`
- **Shows:** Outcome of the most recently executed command — error state and/or wallclock duration.
- **Sources:** Starship `status` + `cmd_duration` · OMP `status` + `executiontime`

**Conditions**

- `icon-only`: renders only when exit code ≠ 0 (shows ✗). On success, block is hidden.
- `exitcode-only`: renders only when exit code ≠ 0.
- `duration-only`: renders only when the last command took ≥ 1s.
- `code+duration`: exit code shown when ≠ 0; duration shown when ≥ 1s. Block hides only if
  both are absent (command succeeded fast).

**Style presets**

| Preset          | Example        |
| --------------- | -------------- |
| `icon-only`     | `✗`            |
| `exitcode-only` | `127`          |
| `duration-only` | `4.2s`         |
| `code+duration` | `✗ 127 · 4.2s` |

---

### `sudo` (display name: "Elevation")

- **Category:** `status`
- **Shows:** Elevated privileges — either running as root, or cached sudo credentials (next `sudo` is password-less).
- **Sources:** Starship `sudo` · OMP `root`

**Conditions**

- Renders when **either** condition holds: current user is `root` (UID 0), **or** `sudo -n true`
  succeeds (credentials cached and non-expired). Hidden otherwise.

**Style presets**

| Preset | Example |
| ------ | ------- |
| `icon` | ``      |
| `text` | `sudo`  |

---

### `jobs`

- **Category:** `status`
- **Shows:** Count of backgrounded shell jobs.
- **Sources:** Starship `jobs` · OMP — (not native, approximable via `command`)

**Conditions**

- Renders only when job count > 0.

**Style presets**

| Preset     | Example    |
| ---------- | ---------- |
| `minimal`  | `✦ 2`      |
| `extended` | `✦ 2 jobs` |

---

### `clock`

- **Category:** `status`
- **Shows:** Wall-clock time and/or battery state.
- **Sources:** Starship `time` + `battery` · OMP `time` + `battery`

**Conditions**

- Time portion: always renders when enabled.
- Battery portion: renders only when a battery is detected (i.e. on laptops / portables).
  On desktops, presets containing battery fields degrade gracefully (e.g. `full` → time only).

**Style presets**

| Preset         | Example        |
| -------------- | -------------- |
| `time-only`    | `14:32`        |
| `battery-icon` | ``             |
| `battery-pct`  | ` 87%`         |
| `full`         | `14:32 ·  87%` |

---

### `sysinfo` (display name: "System Info")

- **Category:** `status`
- **Shows:** Memory, disk, and (on Windows) pagefile utilisation.
- **Sources:** Starship `memory_usage` (partial) · OMP `sysinfo`

**Conditions**

- Always renders when enabled. Pagefile field is Windows-only: on non-Windows, `full`
  degrades to `mem+disk`.

**Style presets**

| Preset     | Example                |
| ---------- | ---------------------- |
| `mem-only` | `󰍛 62%`                |
| `mem+disk` | `󰍛 62% · 󰋊 41%`        |
| `full`     | `󰍛 62% · 󰋊 41% · 󰓡 8%` |

(`󰓡` = pagefile; omitted silently off-Windows.)

---

### Language runtimes (`node`, `python`, `ruby`, `go`, `rust`, `java`, `kotlin`, `scala`, `dotnet`, `php`, `lua`, `swift`, `dart`, `elixir`)

- **Category:** `language`
- **Count:** 14 blocks sharing one template.
- **Shows:** runtime version for the language project in cwd, optionally augmented with
  target version, package manager, virtual env, and detected framework — depending on preset
  and per-language capability.
- **Sources:** Starship `<lang>` + `package` · OMP `<lang>` + framework segments.

**Conditions**

Renders when both hold:

1. The runtime is installed on `$PATH`.
2. cwd is recognised as a project for that language via its marker file(s):

| Block    | Project marker(s)                                        |
| -------- | -------------------------------------------------------- |
| `node`   | `package.json`                                           |
| `python` | `pyproject.toml`, `requirements.txt`, `setup.py`, `*.py` |
| `ruby`   | `Gemfile`, `*.rb`                                        |
| `go`     | `go.mod`                                                 |
| `rust`   | `Cargo.toml`                                             |
| `java`   | `pom.xml`, `build.gradle`                                |
| `kotlin` | `build.gradle.kts`, `*.kt`                               |
| `scala`  | `build.sbt`, `*.scala`                                   |
| `dotnet` | `*.csproj`, `*.sln`, `*.fsproj`                          |
| `php`    | `composer.json`, `*.php`                                 |
| `lua`    | `*.rockspec`, `init.lua`                                 |
| `swift`  | `Package.swift`                                          |
| `dart`   | `pubspec.yaml`                                           |
| `elixir` | `mix.exs`                                                |

**Capability matrix** — which fields apply per language:

| Block    | Target version source                 | Package manager                  | Virtual env                      | Framework detection                                                               |
| -------- | ------------------------------------- | -------------------------------- | -------------------------------- | --------------------------------------------------------------------------------- |
| `node`   | `.nvmrc`, `engines.node`              | npm / pnpm / yarn / bun          | —                                | angular, react, svelte, vue, next, nuxt, nx, aurelia, quasar, tauri, ui5, umbraco |
| `python` | `.python-version`, `requires-python`  | pip / poetry / pdm / uv / pipenv | venv / virtualenv / conda / pixi | —                                                                                 |
| `ruby`   | `.ruby-version`                       | bundler                          | —                                | rails                                                                             |
| `go`     | `go` directive in `go.mod`            | —                                | —                                | —                                                                                 |
| `rust`   | `rust-toolchain.toml`                 | cargo                            | —                                | —                                                                                 |
| `java`   | `pom.xml` / `build.gradle` java ver   | maven / gradle                   | —                                | spring                                                                            |
| `kotlin` | `build.gradle.kts` kotlin ver         | gradle / maven                   | —                                | —                                                                                 |
| `scala`  | `build.sbt` Scala ver                 | sbt / mill                       | —                                | —                                                                                 |
| `dotnet` | `<TargetFramework>` in `*.csproj`     | nuget                            | —                                | —                                                                                 |
| `php`    | `composer.json` `platform.php`        | composer                         | —                                | laravel, symfony                                                                  |
| `lua`    | —                                     | luarocks                         | —                                | —                                                                                 |
| `swift`  | `Package.swift` `swift-tools-version` | SPM                              | —                                | —                                                                                 |
| `dart`   | `environment.sdk` in `pubspec.yaml`   | pub                              | —                                | flutter                                                                           |
| `elixir` | `mix.exs` `elixir:` requirement       | mix / hex                        | —                                | phoenix                                                                           |

**Style presets**

- `minimal` — version only. Always meaningful.
- `compare` — version + target (if available). Target portion hidden when versions match
  exactly, or when the language has no target source; in those cases equivalent to `minimal`.
- `extended` — version + pkg manager + virtual env + framework (each rendered only if
  applicable and detected). Collapses to `minimal` when nothing extra applies.
- `max` — `extended` + target comparison. Same collapse rules as above.

**Canonical preset examples** (using `node` in a pnpm + React project, with `.nvmrc` = `20.10.0`):

| Preset     | Example                              |
| ---------- | ------------------------------------ |
| `minimal`  | ` 22.5.0`                            |
| `compare`  | ` 22.5.0 → 20.10.0`                  |
| `extended` | ` 22.5.0 ·  pnpm ·  react`           |
| `max`      | ` 22.5.0 → 20.10.0 ·  pnpm ·  react` |

**One representative render per language** (preset chosen to exercise each language's most informative fields):

| Block    | Preset     | Example                               |
| -------- | ---------- | ------------------------------------- |
| `node`   | `max`      | ` 22.5.0 → 20.10.0 ·  pnpm ·  react`  |
| `python` | `max`      | ` 3.12.2 → 3.11.0 ·  poetry ·  venv`  |
| `ruby`   | `extended` | ` 3.3.1 ·  bundler ·  rails`          |
| `go`     | `compare`  | ` 1.22.3 → 1.21.0`                    |
| `rust`   | `extended` | ` 1.78.0 ·  cargo`                    |
| `java`   | `max`      | `☕ 21 → 17 ·  gradle ·  spring`      |
| `kotlin` | `extended` | ` 2.0.0 ·  gradle`                    |
| `scala`  | `extended` | ` 3.4.1 ·  sbt`                       |
| `dotnet` | `compare`  | ` 8.0.3 → net8.0`                     |
| `php`    | `max`      | ` 8.3.4 → 8.2 ·  composer ·  laravel` |
| `lua`    | `extended` | ` 5.4.6 ·  luarocks`                  |
| `swift`  | `compare`  | ` 5.10 → 5.9`                         |
| `dart`   | `extended` | ` 3.3.0 ·  flutter`                   |
| `elixir` | `max`      | ` 1.16.2 → 1.15 ·  mix ·  phoenix`    |

---

### Cloud providers (`aws`, `azure`, `gcp`, `kubernetes`, `docker`, `helm`, `terraform`, `pulumi`)

- **Category:** `cloud`
- **Count:** 8 blocks sharing one template.
- **Shape:** each block surfaces a **single value** (context / profile / project / stack /
  chart / workspace) preceded by an icon. Exactly one preset: `default`.
- **Sources:** Starship `aws` / `azure` / `gcloud` / `kubernetes` / `docker_context` / `helm`
  / `pulumi` · OMP `aws` / `az` / `gcp` / `kubectl` / `docker` / `helm` / `terraform` / `pulumi`.

**Per-block variable, condition, and example**

| Block        | Variable                              | Render condition                                                | Example              |
| ------------ | ------------------------------------- | --------------------------------------------------------------- | -------------------- |
| `aws`        | profile (region appended when set)    | `$AWS_PROFILE` or `$AWS_REGION` set, or `~/.aws/config` present | ` prod (eu-west-1)`  |
| `azure`      | active subscription name              | `az account show` returns a subscription                        | `󰠅 Corp-Production`  |
| `gcp`        | active project id                     | `gcloud config get-value project` returns a value               | ` my-project-42`     |
| `kubernetes` | context (namespace appended when set) | `~/.kube/config` present                                        | `󱃾 prod-cluster/app` |
| `docker`     | active Docker context                 | `$DOCKER_CONTEXT` set **or** active context ≠ `default`         | ` desktop-linux`     |
| `helm`       | chart version from `Chart.yaml`       | cwd (or an ancestor up to repo root) contains `Chart.yaml`      | ` nginx-15.4.0`      |
| `terraform`  | active workspace                      | cwd contains `*.tf` **or** a `.terraform/` dir                  | ` default`           |
| `pulumi`     | active stack                          | cwd contains `Pulumi.yaml`                                      | ` dev`               |

**Style preset**

Only one — `default`: icon + value, as shown in the examples above. Sub-fields in parens
(AWS region, k8s namespace) are appended automatically when present; no separate preset.

---

## Out of scope

Candidates considered during the merge of Starship and OMP but deliberately excluded from
the first-pass registry. Grouped by the category they would have lived in, with a short
reason. Re-visit if users ask.

### Handled elsewhere (not block-shaped)

- `prompt_character`, `line_break` — global/zone options, not blocks.
- `text`, `fill` — handled via styles and zone alignment, not as blocks.

### VCS — non-git providers

`hg` (Mercurial), `svn`, `fossil`, `jj` (Jujutsu), `sapling`, `plastic`, `pijul`, `vcsh`.
Reason: audience is overwhelmingly git; other VCS users are already in tool-specific
ecosystems.

### Languages — long tail

`perl`, `c`, `cpp`, `erlang`, `haskell`, `ocaml`, `julia`, `crystal`, `nim`, `zig`, `v`,
`r`, `clojure`, `fortran`, `cobol`, `raku`, `purescript`, `red`, `odin`, `opa`, `typst`,
`solidity`, `fennel`, `gleam`, `haxe`, `daml`, `mojo`, `vala`.
Reason: niche or fringe usage. The block template is generic, so adding any of these later
is cheap.

### Generic / manifest fallbacks

- `framework_version` (generic auto-detect) — superseded by per-language framework detection.
- `package_version` (raw manifest version) — rarely informative outside a language context.

### Build tools (not language-tied)

`deno`, `cmake`, `bazel`, `meson`, `buf`, `xmake`. Reason: either redundant with a language
block or tied to languages we don't ship (C/C++/proto).

### Cloud — niche providers / tools

`openstack`, `nats_context`, `argocd_context`, `firebase_project`, `cloud_foundry` (+ `cftarget`),
`sitecore`, `azure_functions`, `azure_dev_cli`, `cds_version`.

### Environment & shell — niche indicators

`env_var`, `shlvl`, `direnv_status`, `nix_shell`, `guix_shell`, `conda_env` (standalone —
`conda` is still a virtual-env option inside `python`), `pixi_env` (same note), `spack_env`,
`mise_version`, `vagrant_version`, `container_indicator`, `singularity`, `netns`.

### Status — network

`local_ip`, `connection`.

### AI / dev tools

`claude_code`, `github_copilot`, `taskwarrior`, `talosctl`, `unity`, `gitversion`, `nbgv`,
`quarto`, `winget`, `winreg`, `upgrade`. Reason: belong to other surfaces (IDE statuslines,
AI-agent statuslines) rather than the terminal prompt surface.

### Custom / utility

`custom_command`, `http_request`. Reason: out-of-scope escape hatches; the block catalog is
curated rather than open-ended.

### Fun / lifestyle (OMP)

`brewfather`, `carbonintensity`, `ipify`, `nba`, `openweather`, `todoist`, `wakatime`,
`lastfm`, `spotify`, `youtubemusic`, `nightscout`, `ramadan`, `strava`, `withings`.
Reason: lifestyle widgets sit outside `tui-tailor`'s purpose (prompt/statusline composer for
dev workflows).
