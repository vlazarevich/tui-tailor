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
  branch?: string;
  dirty?: boolean;
  staged?: number;
  unstaged?: number;
  untracked?: number;
  ahead?: number;
  behind?: number;
  exitCode?: number;
  nodeVersion?: string;
  pythonVersion?: string;
  rubyVersion?: string;
  golangVersion?: string;
  rustVersion?: string;
  javaVersion?: string;
  awsProfile?: string;
  azureSub?: string;
  gcpProject?: string;
  k8sContext?: string;
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
