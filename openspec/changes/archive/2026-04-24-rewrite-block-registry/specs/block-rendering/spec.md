## MODIFIED Requirements

### Requirement: Scenario data model
Each surface SHALL define a scenario shape (typed fields representing simulated terminal context) and a set of named scenario presets. The terminal-prompt surface SHALL include at minimum these scenario fields: `cwd`, `user`, `host`, `shell`, `os`, `branch`, `dirty`, `staged`, `unstaged`, `untracked`, `deleted`, `renamed`, `ahead`, `behind`, `linesAdded`, `linesRemoved`, `exitCode`, `cmdDuration`, `isSudo`, `jobCount`, `time`, `battery`, `memUsage`, `diskUsage`, `nodeVersion`, `nodeTargetVersion`, `pythonVersion`, `pythonTargetVersion`, `rubyVersion`, `rubyTargetVersion`, `golangVersion`, `golangTargetVersion`, `rustVersion`, `rustTargetVersion`, `javaVersion`, `javaTargetVersion`, `kotlinVersion`, `kotlinTargetVersion`, `scalaVersion`, `scalaTargetVersion`, `dotnetVersion`, `dotnetTargetVersion`, `phpVersion`, `phpTargetVersion`, `luaVersion`, `luaTargetVersion`, `swiftVersion`, `swiftTargetVersion`, `dartVersion`, `dartTargetVersion`, `elixirVersion`, `elixirTargetVersion`, `awsProfile`, `azureSub`, `gcpProject`, `k8sContext`, `dockerContext`, `helmChart`, `terraformWorkspace`, `pulumiStack`.

#### Scenario: Terminal prompt scenario presets
- **WHEN** the terminal-prompt surface is loaded
- **THEN** at least 5 scenario presets are available covering git, languages, cloud, error, and basic states

#### Scenario: Scenario preset provides realistic data
- **WHEN** the "Node Project" preset is selected
- **THEN** it provides non-empty values for `cwd`, `user`, `host`, `branch`, and `nodeVersion` at minimum

#### Scenario: Missing scenario field
- **WHEN** a scenario preset does not define a field that a block element's source references
- **THEN** that element resolves to empty string

#### Scenario: New fields available for new blocks
- **WHEN** the "Cloud" scenario preset is selected
- **THEN** it provides values for at least one of: `awsProfile`, `k8sContext`, `dockerContext`, `terraformWorkspace`
