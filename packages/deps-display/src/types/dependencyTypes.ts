export interface DependencyJsonData {
  _scanSource: ScanSource[];
  _analysisTarget: string[];
  _blackList: string[];
  _browserApis: string[];
  _isScanVue: boolean;
  _analysisPlugins: string[];
  pluginsQueue: PluginQueue[];
  browserQueue: unknown[];
  importItemMap: Record<string, ImportItemMapEntry>;
  typeMap?: Record<string, Record<string, TypeMapEntry>>;
  apiMap?: Record<string, Record<string, ApiMapEntry>>;
  methodMap?: Record<string, Record<string, MethodMapEntry>>;
  versionMap: Record<string, Record<string, string>>; // 包版本信息映射 project -> package -> version
  browserMap?: Record<string, BrowserApiEntry>; // 浏览器API使用情况映射
}

export interface ScanSource {
  name: string;
  path: string[];
  httpRepo: string;
  packageFile: string;
  tsConfigPath: string;
}

export interface PluginQueue {
  mapName: string;
  checkFn: string;
  afterHook: null;
}

export interface ImportItemMapEntry {
  [key: string]: {
    callOrigin: string | null;
    callFiles: Record<string, CallFileInfo>;
  };
}

export interface TypeMapEntry {
  callNum: number;
  callOrigin: string | null;
  callFiles: Record<string, CallFileInfo>;
  isBlack?: boolean;
}

export interface CallFileInfo {
  projectName: string;
  httpRepo: string;
  lines: number[];
}

export interface ApiMapEntry {
  callNum: number;
  callOrigin: string | null;
  callFiles: Record<string, CallFileInfo>;
  isBlack?: boolean;
}

export interface MethodMapEntry {
  callNum: number;
  callOrigin: string | null;
  callFiles: Record<string, CallFileInfo>;
  isBlack?: boolean;
}

export interface BrowserApiEntry {
  callNum: number;
  callOrigin: string | null;
  callFiles: Record<string, CallFileInfo>;
  isBlack?: boolean;
}
