export interface DependencyJsonData {
  scanSource: ScanSource[];
  _analysisTarget: string[];
  _blackList: string[];
  _globalApis: string[];
  _isScanVue: boolean;
  _analysisPlugins: string[];
  pluginsQueue: PluginQueue[];
  globalQueue: unknown[];
  importItemMap: Record<string, ImportItemMapEntry>;
  typeMap?: Record<string, Record<string, TypeMapEntry>>;
  apiMap?: Record<string, Record<string, ApiMapEntry>>;
  methodMap?: Record<string, Record<string, MethodMapEntry>>;
  versionMap: Record<string, Record<string, string>>; // 包版本信息映射 project -> package -> version
  globalMap?: Record<string, GlobalApiEntry>; // 全局API使用情况映射
  ghostDependenciesWarn?: Record<string, string[]>; // 可能存在幽灵依赖的警告
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
  [key: string]:
    | {
        callOrigin: string | null;
        callFiles: Record<string, CallFileInfo>;
      }
    | string
    | undefined;
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
  callOrigin: string | null;
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

export interface GlobalApiEntry {
  callNum: number;
  callOrigin: string | null;
  callFiles: Record<string, CallFileInfo>;
  isBlack?: boolean;
}

// Node API相关类型
export interface NodeApiEntry {
  callNum: number;
  callOrigin: string | null;
  callFiles: Record<string, CallFileInfo>;
  isBlack?: boolean;
}
