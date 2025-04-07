import { getUncommittedChanges, getLocalization, Language } from '@t-care/utils';
import { createMastra, Mastra } from '@t-care/mastra';
import {
  CodeInspectionOptions,
  CodeInspectionResult,
  CodeInspectionService,
  CodeReviewConfig,
  CodeReviewResult,
  FileChange,
} from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Git代码审查服务 - 使用Mastra进行代码审查
 */
export class GitCodeReviewService implements CodeInspectionService {
  private defaultOptions: CodeInspectionOptions;
  private mastra: Mastra;
  private excludeExtensions: string[] = ['.json']; // 默认排除的文件扩展名

  /**
   * 构造函数
   * @param defaultOptions 默认选项
   * @param excludeExtensions 要排除的文件扩展名数组，默认包含.json
   */
  constructor(defaultOptions: CodeInspectionOptions, excludeExtensions?: string[]) {
    this.defaultOptions = defaultOptions;
    this.mastra = createMastra(defaultOptions.model);

    // 如果提供了自定义排除扩展名，则覆盖默认值
    if (excludeExtensions && excludeExtensions.length > 0) {
      this.excludeExtensions = excludeExtensions;
    }
  }

  /**
   * 检查代码
   * @param code 代码内容
   * @param options 选项
   * @returns 检查结果
   */
  async inspectCode(code: string, options?: Partial<CodeInspectionOptions>): Promise<CodeInspectionResult> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const language = (mergedOptions.language || 'zh') as Language;
    const texts = getLocalization(language);

    try {
      // 使用mastra的代码审查agent
      const agent = this.mastra.getAgent('codeReviewAgent');
      const result = await agent.generate([
        {
          role: 'user',
          content: `请审查以下代码，关注${mergedOptions.detailed ? '详细的' : '简要的'}问题和改进建议：
  
\`\`\`
${code}
\`\`\`
`,
        },
      ]);

      // 解析响应
      return {
        suggestions: result.text.split('\n'),
        model: mergedOptions.model,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(texts.review.errorReviewing, error);
      return {
        suggestions: [texts.review.errorReviewing],
        model: mergedOptions.model,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 审查未提交的本地变更
   * @param options 审查配置
   * @returns 审查结果数组
   */
  async inspectLocalChanges(options?: Partial<CodeReviewConfig>): Promise<CodeReviewResult[]> {
    try {
      // 获取语言设置
      const language = (options?.language || this.defaultOptions.language || 'zh') as Language;
      const texts = getLocalization(language);

      // 从工作目录获取未提交的变更
      const changes = await getUncommittedChanges(undefined, language);

      // 如果没有变更，返回一条消息
      if (!changes.length) {
        return [
          {
            issues: [],
            suggestions: [],
            summary: texts.git.noChanges,
            fileName: '',
          },
        ];
      }

      // 将变更传递给reviewChanges方法进行审查
      return this.reviewChanges(changes, options);
    } catch (error) {
      const language = (options?.language || this.defaultOptions.language || 'zh') as Language;
      const texts = getLocalization(language);

      console.error(texts.git.errorGetChanges, error);

      // 返回错误结果
      return [
        {
          issues: [`${texts.git.errorGetChanges}: ${error instanceof Error ? error.message : String(error)}`],
          suggestions: [texts.review.installGit],
          summary: texts.review.errorReviewing,
          fileName: '',
        },
      ];
    }
  }

  /**
   * 审查指定文件
   * @param files 文件路径数组
   * @param options 审查配置
   * @returns 审查结果数组
   */
  async inspectFiles(files: string[], options?: Partial<CodeReviewConfig>): Promise<CodeReviewResult[]> {
    const language = (options?.language || this.defaultOptions.language || 'zh') as Language;
    const texts = getLocalization(language);

    if (!files.length) {
      return [
        {
          issues: [texts.review.noProvidedFiles],
          suggestions: [texts.review.provideFiles],
          summary: texts.review.noContent,
          fileName: texts.review.noFile,
        },
      ];
    }

    const fileChanges: FileChange[] = [];
    const results: CodeReviewResult[] = [];
    const excludedFiles: string[] = [];

    // 读取所有文件内容
    for (const filePath of files) {
      // 检查文件是否应该被排除
      if (this.shouldExcludeFile(filePath)) {
        excludedFiles.push(filePath);
        continue;
      }

      try {
        // 获取绝对路径
        const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);

        // 读取文件内容
        const content = await fs.readFile(absolutePath, 'utf-8');

        // 创建FileChange对象
        fileChanges.push({
          file: filePath,
          content,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`${texts.git.readFileError} ${filePath}:`, error);

        // 添加错误结果
        if (errorMessage.includes('ENOENT')) {
          results.push({
            issues: [`${texts.review.fileNotExist}: ${filePath}`],
            suggestions: [texts.review.verifyPath],
            summary: texts.review.fileNotExist,
            fileName: filePath,
          });
        } else {
          results.push({
            issues: [`${texts.git.readFileError} ${filePath}: ${errorMessage}`],
            suggestions: [texts.review.checkReadable],
            summary: texts.review.errorReadingFile,
            fileName: filePath,
          });
        }
      }
    }

    // 如果有成功读取的文件，使用reviewChanges方法进行审查
    if (fileChanges.length > 0) {
      const reviewResults = await this.reviewChanges(fileChanges, options);
      results.push(...reviewResults);
    }

    // 如果有被排除的文件，添加一个提示信息
    if (excludedFiles.length > 0) {
      results.push({
        issues: [],
        suggestions: [],
        summary: `${texts.review.excludedFiles}: ${excludedFiles.length} ${texts.review.filesExcluded}: ${excludedFiles.join(', ')}`,
        fileName: texts.review.excludedFiles,
      });
    }

    return results;
  }

  /**
   * 检查文件是否应该被排除审查
   * @param filePath 文件路径
   * @returns 是否应该排除
   */
  private shouldExcludeFile(filePath: string): boolean {
    const extension = path.extname(filePath).toLowerCase();
    return this.excludeExtensions.includes(extension);
  }

  /**
   * 审查多个变更
   * @param changes 变更数组
   * @param options 审查配置
   * @returns 审查结果数组
   */
  private async reviewChanges(changes: FileChange[], options?: Partial<CodeReviewConfig>): Promise<CodeReviewResult[]> {
    // 获取语言设置，优先使用选项中的设置，其次使用默认设置
    const language = (options?.language || this.defaultOptions.language || 'zh') as Language;
    const texts = getLocalization(language);

    // 过滤掉不需要审查的文件（如JSON文件）
    const filteredChanges = changes.filter((change) => !this.shouldExcludeFile(change.file));

    if (!filteredChanges.length) {
      return [
        {
          issues: [texts.review.noProvidedFiles],
          suggestions: [texts.review.provideFiles],
          summary: texts.review.noContent,
          fileName: texts.review.noFile,
        },
      ];
    }

    const results: CodeReviewResult[] = [];
    const agent = this.mastra.getAgent('codeReviewAgent');

    for (const change of filteredChanges) {
      try {
        console.log('\n------------------------------------------');
        console.log(`${texts.review.reviewingCode}: ${change.file}`);
        if (options?.focus) {
          console.log(`${texts.review.focus}: ${options.focus}`);
        }

        const result = await agent.generate([
          {
            role: 'user',
            content: `请审查以下代码：
              
\`\`\`
${change.content}
\`\`\`

${options?.focus ? `请特别关注: ${options.focus}` : ''}

请提供:
1. 代码中的问题和潜在缺陷
2. 改进建议
3. 优点和良好实践
4. 简要总结

请使用${language === 'en' ? '英文' : '中文'}回复。`,
          },
        ]);

        // 解析结果
        const lines = result.text.split('\n').filter((line) => line.trim());

        // 简单分类响应
        const issues: string[] = [];
        const suggestions: string[] = [];
        let summary = '';

        let currentSection = '';
        for (const line of lines) {
          // 根据语言识别不同的分节标题
          if (language === 'en') {
            if (line.includes('Issue') || line.includes('Problem') || line.includes('Defect')) {
              currentSection = 'issues';
              continue;
            } else if (line.includes('Suggestion') || line.includes('Improvement')) {
              currentSection = 'suggestions';
              continue;
            } else if (line.includes('Summary') || line.includes('Overall')) {
              currentSection = 'summary';
              continue;
            } else if (line.includes('Strength') || line.includes('Good Practice') || line.includes('Advantage')) {
              currentSection = 'strengths';
              continue;
            }
          } else {
            if (line.includes('问题') || line.includes('缺陷')) {
              currentSection = 'issues';
              continue;
            } else if (line.includes('建议') || line.includes('改进')) {
              currentSection = 'suggestions';
              continue;
            } else if (line.includes('总结') || line.includes('总体')) {
              currentSection = 'summary';
              continue;
            } else if (line.includes('优点') || line.includes('良好实践')) {
              currentSection = 'strengths';
              continue;
            }
          }

          if (currentSection === 'issues') {
            issues.push(line);
          } else if (currentSection === 'suggestions') {
            suggestions.push(line);
          } else if (currentSection === 'summary') {
            summary += line + ' ';
          }
        }

        results.push({
          issues: issues.length ? issues : [texts.review.noIssues],
          suggestions: suggestions.length ? suggestions : [texts.review.noSuggestions],
          summary: summary || texts.review.goodQuality,
          fileName: change.file,
        });
      } catch (error) {
        const errorMsg = `${texts.review.errorReviewing} ${change.file}: ${error instanceof Error ? error.message : String(error)}`;

        console.error(errorMsg);
        results.push({
          issues: [errorMsg],
          suggestions: [texts.review.reviewSeparately],
          summary: texts.review.errorReviewing,
          fileName: change.file,
        });
      }
    }

    return results;
  }
}
