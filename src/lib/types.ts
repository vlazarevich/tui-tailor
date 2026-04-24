export type ElementRole = "content" | "icon" | "connector";

export interface ElementDefinition {
  value?: string;
  capture?: string;
  role: ElementRole;
  themeSlot?: string;
}

export interface TargetCaptureBinding {
  setup: string[];
  ref: string;
  guard: string;
}

export interface CaptureDefinition {
  scenario: (data: ScenarioData) => string | number | boolean | undefined;
  /** If true, capture is optional (gates its own element inline). Default false = required (gates the block). */
  optional?: boolean;
  targets: Record<ExportTargetId, TargetCaptureBinding>;
}

export interface TargetHook {
  preExec: string[];
  promptLocal: string[];
}

export interface BlockDefinition {
  id: string;
  name: string;
  category: string;
  surfaces: string[];
  elements: Record<string, ElementDefinition>;
  captures?: Record<string, CaptureDefinition>;
  styles: Record<string, string>;
  themeSlot: string;
  defaultStyle: string;
  exportCosts: Record<string, number>;
  targetHooks?: Partial<Record<ExportTargetId, TargetHook>>;
}

export interface ResolvedElement {
  name: string;
  text: string;
  themeSlot: string;
  role: ElementRole;
}

export type RenderSpanRole = "content" | "icon" | "connector" | "bracket" | "separator";

export interface RenderSpan {
  text: string;
  fg: string | null;
  bg: string | null;
  role: RenderSpanRole;
}

export interface PlainConfig {
  gap: string;
}

export interface FlowConfig {
  gap: string;
}

export interface BracketsConfig {
  open: string;
  close: string;
  padding: string;
  gap: string;
}

export interface PowerlineConfig {
  lead: string;
  trail: string;
}

export interface PowertabConfig {
  lead: string;
  trail: string;
}

export type ZoneLayoutType = "plain" | "flow" | "brackets" | "powerline" | "powertab";

export interface ZoneTargetBinding {
  slot: string;
  strategy?: string;
  [k: string]: unknown;
}

export type ZoneLayout =
  | { type: "plain"; config: PlainConfig }
  | { type: "flow"; config: FlowConfig }
  | { type: "brackets"; config: BracketsConfig }
  | { type: "powerline"; config: PowerlineConfig }
  | { type: "powertab"; config: PowertabConfig };

export interface ScenarioData {
  cwd?: string;
  user?: string;
  host?: string;
  shell?: string;
  os?: string;
  branch?: string;
  dirty?: boolean;
  staged?: number;
  unstaged?: number;
  untracked?: number;
  deleted?: number;
  renamed?: number;
  ahead?: number;
  behind?: number;
  linesAdded?: number;
  linesRemoved?: number;
  exitCode?: number;
  isSudo?: boolean;
  battery?: string;
  memUsage?: string;
  diskUsage?: string;
  nodeVersion?: string;
  nodeTargetVersion?: string;
  pythonVersion?: string;
  pythonTargetVersion?: string;
  rubyVersion?: string;
  rubyTargetVersion?: string;
  golangVersion?: string;
  golangTargetVersion?: string;
  rustVersion?: string;
  rustTargetVersion?: string;
  javaVersion?: string;
  javaTargetVersion?: string;
  kotlinVersion?: string;
  kotlinTargetVersion?: string;
  scalaVersion?: string;
  scalaTargetVersion?: string;
  dotnetVersion?: string;
  dotnetTargetVersion?: string;
  phpVersion?: string;
  phpTargetVersion?: string;
  luaVersion?: string;
  luaTargetVersion?: string;
  swiftVersion?: string;
  swiftTargetVersion?: string;
  dartVersion?: string;
  dartTargetVersion?: string;
  elixirVersion?: string;
  elixirTargetVersion?: string;
  awsProfile?: string;
  azureSub?: string;
  gcpProject?: string;
  k8sContext?: string;
  dockerContext?: string;
  helmChart?: string;
  terraformWorkspace?: string;
  pulumiStack?: string;
  time?: string;
  jobCount?: number;
  cmdDuration?: string;
  multilineCommand?: boolean;
}

export interface BlockInstance {
  blockId: string;
  style: string;
}

export interface ZoneDefinition {
  id: string;
  name: string;
  optional?: boolean;
  targetBindings: Record<ExportTargetId, ZoneTargetBinding>;
}

export interface GlobalOptionDefinition {
  id: string;
  name: string;
  type: "boolean" | "string";
  defaultValue: string | boolean;
}

export interface Surface {
  id: string;
  name: string;
  zones: ZoneDefinition[];
  globalOptions: GlobalOptionDefinition[];
  defaultLayout: ZoneLayoutType;
}

export interface ZoneConfig {
  blocks: BlockInstance[];
  layout?: ZoneLayoutType;
  enabled?: boolean;
}

export interface SurfaceConfig {
  surfaceId: string;
  zones: Record<string, ZoneConfig>;
  globalOptions: Record<string, string | boolean>;
  themeId: string;
}

export type ExportTargetId = string;

export interface ExportTarget {
  id: ExportTargetId;
  name: string;
  surfaceId: string;
  blockCosts: Record<string, number>;
  zoneCosts: Record<string, number>;
}

export interface CodeSection {
  label: string;
  code: string;
}
