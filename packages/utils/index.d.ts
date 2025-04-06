/**
 * Care项目工具库
 * 提供Git变更获取和代码分析功能
 */

import { SimpleGit as GitType } from 'simple-git';

/**
 * 文件变更信息
 */
export interface FileChange {
  /** 文件路径 */
  file: string;
  /** 文件内容 */
  content: string;
}

/**
 * CLI选项
 */
export interface CLIOptions {
  /** 是否显示详细日志 */
  verbose: boolean;
  /** 是否使用结构化输出 */
  structured: boolean;
  /** 审查重点 */
  focus: 'all' | 'performance' | 'security' | 'maintainability' | 'readability' | 'bestPractices';
}

/**
 * Git简易接口定义
 */
export interface SimpleGit {
  /** 检查当前目录是否为Git仓库 */
  checkIsRepo(): Promise<boolean>;
  /** 获取仓库状态 */
  status(): Promise<{
    not_added: string[];
    modified: string[];
    created: string[];
    renamed: { from: string; to: string }[];
    staged: string[];
  }>;
  /** 显示文件内容 */
  show(args: string[]): Promise<string>;
  /** 获取未提交的文件列表 */
  getUncommittedFiles(): Promise<string[]>;
  /** 获取未提交的代码变更 */
  getUncommittedChanges(): Promise<FileChange[]>;
  /** 获取已暂存的代码变更 */
  getStagedChanges(): Promise<FileChange[]>;
  /** 获取未暂存的代码变更 */
  getUnstagedChanges(): Promise<FileChange[]>;
  /** 获取文件差异 */
  getDiff(filePath: string): Promise<string>;
  /** 获取文件历史 */
  getFileHistory(filePath: string, limit?: number): Promise<any[]>;
}

/**
 * 严重程度等级
 */
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

/**
 * 问题分类
 */
export type IssueCategory =
  | 'performance'
  | 'security'
  | 'maintainability'
  | 'readability'
  | 'bestPractices'
  | 'accessibility'
  | 'other';

/**
 * 代码问题接口
 */
export interface CodeIssue {
  severity: SeverityLevel;
  category: IssueCategory;
  description: string;
  suggestion: string;
  codeSnippet?: string;
}

/**
 * 结构化审查结果
 */
export interface StructuredReviewResult {
  overallScore: number;
  scores: Record<string, number>;
  issues: CodeIssue[];
  recommendations: string[];
  strengths: string[];
  summary: string;
}

/**
 * Git工具类
 */
export class GitUtils implements SimpleGit {
  /**
   * 构造函数
   * @param rootDir Git仓库根目录，默认为当前目录
   */
  constructor(rootDir?: string);

  /** 检查当前目录是否为Git仓库 */
  checkIsRepo(): Promise<boolean>;

  /** 获取仓库状态 */
  status(): Promise<{
    not_added: string[];
    modified: string[];
    created: string[];
    renamed: { from: string; to: string }[];
    staged: string[];
  }>;

  /** 显示文件内容 */
  show(args: string[]): Promise<string>;

  /** 获取未提交的文件列表 */
  getUncommittedFiles(): Promise<string[]>;

  /** 获取未提交的代码变更 */
  getUncommittedChanges(): Promise<FileChange[]>;

  /** 获取已暂存的代码变更 */
  getStagedChanges(): Promise<FileChange[]>;

  /** 获取未暂存的代码变更 */
  getUnstagedChanges(): Promise<FileChange[]>;

  /** 获取文件差异 */
  getDiff(filePath: string): Promise<string>;

  /** 获取文件历史 */
  getFileHistory(filePath: string, limit?: number): Promise<any[]>;
}

/**
 * 获取未提交的代码变更
 * @param dir 目录路径，默认为当前目录
 * @returns 未提交的代码变更
 */
export function getUncommittedChanges(dir?: string): Promise<FileChange[]>;

/**
 * 获取已暂存的代码变更
 * @param dir 目录路径，默认为当前目录
 * @returns 已暂存的代码变更
 */
export function getStagedChanges(dir?: string): Promise<FileChange[]>;

/**
 * 获取未暂存的代码变更
 * @param dir 目录路径，默认为当前目录
 * @returns 未暂存的代码变更
 */
export function getUnstagedChanges(dir?: string): Promise<FileChange[]>;

/**
 * 获取文件的Git差异信息
 * @param filePath 文件路径
 * @param dir 目录路径，默认为当前目录
 * @returns 差异信息
 */
export function getFileDiff(filePath: string, dir?: string): Promise<string>;
