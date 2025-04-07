/**
 * CLI类型定义
 */

import { CLIOptions, Language } from '@t-care/utils';

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
