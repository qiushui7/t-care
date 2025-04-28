import * as ts from 'typescript';

/**
 * 依赖分析配置
 */
export interface ScanSource {
  /** 项目名称 */
  name: string;
  /** 包含扫描路径 */
  include: string[];
  /** 排除扫描路径 */
  exclude?: string[];
  /** tsconfig.json 路径 */
  tsConfigPath: string;
  /** package.json 路径 */
  packageJsonPath?: string;
  /** 文件路径格式化函数 */
  format?: ((path: string) => string) | null;
  /** 仓库URL前缀 */
  httpRepo?: string;
}

// 分析插件接口
export interface AnalysisPlugin {
  mapName: string;
  checkFn: MethodCheckFunction;
  afterHook: null | AfterHookFunction;
}

// 方法检查函数类型
export interface MethodCheckFunction {
  (
    context: any,
    tsCompiler: typeof ts,
    node: ts.Node,
    depth: number,
    depName: string,
    apiName: string,
    matchImportItem: {
      origin: string | null;
      [key: string]: any;
    },
    filePath: string,
    projectName: string,
    httpRepo: string,
    line: number,
    absolutePath: string
  ): boolean;
}

// 后处理钩子函数类型
export interface AfterHookFunction {
  (
    context: any,
    mapName: string,
    importItems: Record<string, any>,
    ast: any,
    checker: any,
    filePath: string,
    projectName: string,
    httpRepo: string,
    baseLine: number
  ): void;
}

// 分析插件创建函数
export interface AnalysisPluginCreator {
  (context: any): AnalysisPlugin;
}

export interface DepsAnalysisOptions {
  scanSource: ScanSource[];
  analysisTarget: string[];
  blackList?: string[];
  globalApis?: string[];
  isScanVue?: boolean;
  analysisPlugins?: AnalysisPluginCreator[];
  cacheDir?: string;
  incremental?: boolean;
}

export interface DiagnosisInfo {
  projectName: string;
  matchImportItem: any;
  depName: string;
  apiName: string;
  httpRepo: string;
  file: string;
  line: number;
  stack: string;
}
