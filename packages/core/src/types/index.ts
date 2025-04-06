import { OpenAIChatModelId } from '@t-care/mastra';
import { FileChange } from '@t-care/utils';

export { FileChange } from '@t-care/utils';

/**
 * 问题类别
 */
export enum IssueCategory {
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  CODE_QUALITY = 'code_quality',
  BEST_PRACTICES = 'best_practices',
  ACCESSIBILITY = 'accessibility',
  DEPENDENCIES = 'dependencies',
}

/**
 * 代码审查结果接口
 */
export interface CodeReviewResult {
  issues: string[];
  suggestions: string[];
  summary?: string;
  fileName?: string;
}

/**
 * 代码审查配置
 */
export interface CodeReviewConfig {
  focus?: string;
  detailed?: boolean;
  model?: string;
  excludeExtensions?: string[];
}

/**
 * 代码审查器接口
 */
export interface CodeReviewer {
  reviewCode(code: string | FileChange[], config?: CodeReviewConfig): Promise<CodeReviewResult>;
  reviewFile(fileChange: FileChange, config?: CodeReviewConfig): Promise<CodeReviewResult>;
}

/**
 * 代码检查服务接口
 */
export interface CodeInspectionService {
  inspectCode?(code: string, options?: Partial<CodeInspectionOptions>): Promise<CodeInspectionResult>;
  inspectLocalChanges?(options?: Partial<CodeReviewConfig>): Promise<CodeReviewResult[]>;
  inspectFiles?(files: string[], options?: Partial<CodeReviewConfig>): Promise<CodeReviewResult[]>;
}

/**
 * 提示词生成器配置
 */
export interface PromptGeneratorConfig {
  detailed?: boolean;
  includeCodeSnippets?: boolean;
  focus?: string;
  maxTokens?: number;
}

/**
 * 提示词生成器接口
 */
export interface PromptGenerator {
  generateReviewPrompt(code: string | FileChange[], config?: PromptGeneratorConfig): string;
  generateFileReviewPrompt(file: FileChange, config?: PromptGeneratorConfig): string;
}

/**
 * 代码检查选项
 */
export interface CodeInspectionOptions {
  model: OpenAIChatModelId;
  detailed: boolean;
  includeCodeSnippets?: boolean;
  focus?: string;
  maxSuggestions?: number;
  excludeExtensions?: string[];
}

/**
 * 代码检查结果
 */
export interface CodeInspectionResult {
  suggestions: string[];
  model: string;
  timestamp: string;
  structuredResult?: any;
  error?: string;
}
