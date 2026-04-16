export type ElementRole = "content" | "icon" | "connector";

export interface ElementDefinition {
  source?: string;
  value?: string;
  format?: string;
  role: ElementRole;
  themeSlot?: string;
}

export interface BlockDefinition {
  id: string;
  name: string;
  category: string;
  surfaces: string[];
  elements: Record<string, ElementDefinition>;
  styles: Record<string, string>;
  themeSlot: string;
  defaultStyle: string;
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
  separator: string;
  terminator: string;
}

export interface PowertabConfig {
  separator: string;
  terminator: string;
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
}

export interface BlockInstance {
  blockId: string;
  style: string;
}

export interface ZoneDefinition {
  id: string;
  name: string;
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
  defaultLayout: ZoneLayout;
}

export interface ZoneConfig {
  blocks: BlockInstance[];
  layout?: ZoneLayout;
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
}
