/**
 * CLI类型定义
 */

import { CLIOptions, Language } from '@t-care/utils';
import { DepsAnalysisOptions as DepsAnalysisConfig } from '@t-care/deps-analysis';

export { ScanSource } from '@t-care/deps-analysis';

/**
 * 命令行选项，扩展自基础CLIOptions
 */
export interface CommandOptions extends CLIOptions {
  /** 文件路径列表 */
  files?: string[];
  /** 输出格式 */
  format?: 'text' | 'json';
  /** 审查重点 */
  focus: 'all' | 'performance' | 'security' | 'maintainability' | 'readability' | 'bestPractices';
  /** 是否使用详细模式 */
  detailed?: boolean;
  /** 模型名称 */
  model?: string;
  /** 排除的文件扩展名 */
  excludeExtensions?: string[];
  /** 初始化配置 (local|global) */
  init?: string | boolean;
  /** 显示配置 */
  show?: boolean;
  /** 返回结果的语言 */
  language?: Language;
}

/**
 * 命令执行结果
 */
export interface CommandResult {
  /** 是否成功 */
  success: boolean;
  /** 结果数据 */
  data?: any;
  /** 错误信息 */
  error?: string;
  /** 成功消息 */
  message?: string;
  /** 是否显示帮助 */
  showHelp?: boolean;
}

/**
 * 命令处理函数类型
 */
export type CommandHandler = (options: CommandOptions) => Promise<CommandResult>;

/**
 * 配置文件类型定义
 */
export interface CareConfig {
  /** OpenAI API密钥 */
  openaiKey: string;
  /** 使用的模型 */
  model: string;
  /** 是否显示详细信息 */
  detailed: boolean;
  /** 审查重点 */
  focus: 'all' | 'performance' | 'security' | 'maintainability' | 'readability' | 'bestPractices';
  /** 排除的文件扩展名 */
  excludeExtensions: string[];
  /** 输出语言 */
  language: Language;
  /** 依赖分析相关配置 */
  depsAnalysis: DepsAnalysisConfig;
}

/**
 * 定义配置的辅助函数，提供类型提示
 * @param config 配置对象
 * @returns 配置对象
 */
export function defineConfig(config: Partial<CareConfig>): Partial<CareConfig> {
  return config;
}
