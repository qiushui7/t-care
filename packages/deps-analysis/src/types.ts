import * as ts from 'typescript';

/**
 * 依赖分析配置
 */
export interface ScanSource {
  /** 项目名称 */
  name: string;
  /** 扫描路径 */
  path: string[];
  /** tsconfig.json 路径 */
  tsConfigPath: string;
  /** package.json 路径 */
  packageFile?: string;
  /** 文件路径格式化函数 */
  format?: ((path: string) => string) | null;
  /** 仓库URL前缀 */
  httpRepo?: string;
}

/**
 * 支持的语言类型
 */
export type Language = 'zh' | 'en';

/**
 * 分析配置
 */
export interface AnalysisConfig {
  /** 项目路径 */
  projectPath: string;
  /** 输出目录 */
  outputDir: string;
  /** 排除模式 */
  excludePatterns?: string[];
  /** 包含私有依赖 */
  includePrivate?: boolean;
  /** 最大递归深度 */
  maxDepth?: number;
  /** 分析报告标题 */
  reportTitle?: string;
  /** 输出语言 */
  language?: Language;
}

/**
 * 评分结果
 */
export interface ScoreResult {
  /** 评分 */
  score: number;
  /** 建议信息 */
  message: string[];
}

/**
 * 分析报告
 */
export interface AnalysisReport {
  /** 报告标题 */
  title: string;
  /** 分析配置 */
  config: AnalysisConfig;
  /** 评分结果 */
  score?: ScoreResult;
  /** 依赖调用分析结果 */
  callAnalysis: CallAnalysisResult[];
  /** API调用分析结果 */
  apiAnalysis: ApiAnalysisResult[];
  /** 解析错误信息 */
  parseErrors: string[];
}

/**
 * 分析结果
 */
export interface AnalysisResult {
  /** 报告标题 */
  title: string;
  /** 分数 */
  score: number;
  /** 调用分析结果 */
  callAnalysis: CallAnalysisResult[];
  /** API分析结果 */
  apiAnalysis: ApiAnalysisResult[];
  /** 分析配置 */
  config: AnalysisConfig;
  /** 分析时间 */
  timestamp: string;
}

/**
 * 命令选项
 */
export interface CommandOptions {
  /** 项目路径 */
  project?: string;
  /** 输出目录 */
  output?: string;
  /** 配置文件路径 */
  config?: string;
  /** 输出格式 */
  format?: 'html' | 'json';
  /** 是否显示详细信息 */
  verbose?: boolean;
  /** 输出语言 */
  language?: string;
  /** 排除模式 */
  exclude?: string;
}

export interface CallAnalysisResult {
  /** 模块名称 */
  moduleName: string;
  /** 调用次数 */
  callCount: number;
  /** 依赖文件列表 */
  dependencies: string[];
}

export interface ApiAnalysisResult {
  /** API路径 */
  apiPath: string;
  /** 调用次数 */
  callCount: number;
  /** 使用该API的文件列表 */
  usedBy: string[];
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
    line: number
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
  browserApis?: string[];
  isScanVue?: boolean;
  analysisPlugins?: AnalysisPluginCreator[];
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
