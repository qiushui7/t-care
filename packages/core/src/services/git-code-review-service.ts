import { getUncommittedChanges } from '@t-care/utils';
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
      console.error('代码审查失败:', error);
      return {
        suggestions: ['代码审查过程中出现错误'],
        model: mergedOptions.model,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 审查本地未提交的变更
   * @param options 审查配置
   * @returns 审查结果数组
   */
  async inspectLocalChanges(options?: Partial<CodeReviewConfig>): Promise<CodeReviewResult[]> {
    try {
      // 获取未提交的变更
      const changes = await getUncommittedChanges();
      return await this.reviewChanges(changes, options);
    } catch (error) {
      console.error('审查本地变更失败:', error);
      return [
        {
          issues: [`获取未提交变更时出错: ${error instanceof Error ? error.message : String(error)}`],
          suggestions: ['请确保当前目录是一个Git仓库，并且有可审查的变更。'],
          summary: '审查过程中出现错误',
          fileName: '本地变更',
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
    if (!files.length) {
      return [
        {
          issues: ['未提供文件路径'],
          suggestions: ['请提供至少一个文件路径进行审查'],
          summary: '无可审查内容',
          fileName: '无文件',
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
        console.error(`读取文件 ${filePath} 失败:`, error);

        // 添加错误结果
        if (errorMessage.includes('ENOENT')) {
          results.push({
            issues: [`文件 ${filePath} 不存在`],
            suggestions: ['请确认文件路径是否正确'],
            summary: '文件不存在',
            fileName: filePath,
          });
        } else {
          results.push({
            issues: [`读取文件 ${filePath} 时出错: ${errorMessage}`],
            suggestions: ['请检查文件是否可读取，格式是否正确'],
            summary: '读取文件过程中出现错误',
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
        summary: `以下${excludedFiles.length}个文件被排除审查（JSON文件）: ${excludedFiles.join(', ')}`,
        fileName: '被排除文件',
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
    // 过滤掉不需要审查的文件（如JSON文件）
    const filteredChanges = changes.filter((change) => !this.shouldExcludeFile(change.file));

    if (!filteredChanges.length) {
      return [
        {
          issues: ['没有找到需要审查的变更'],
          suggestions: ['请确保有未提交的变更，且不是被排除的文件类型（如JSON文件）。'],
          summary: '无可审查内容',
          fileName: '无文件',
        },
      ];
    }

    const results: CodeReviewResult[] = [];
    const agent = this.mastra.getAgent('codeReviewAgent');

    for (const change of filteredChanges) {
      try {
        // 不需要检查删除状态，依赖utils模块提供的变更

        const result = await agent.generate([
          {
            role: 'user',
            content: `请审查以下${options?.detailed ? '（需要详细分析）' : ''}代码文件 ${change.file}：
              
\`\`\`
${change.content}
\`\`\`

${options?.focus ? `请特别关注: ${options.focus}` : ''}

请提供:
1. 代码中的问题和潜在缺陷
2. 改进建议
3. 优点和良好实践
4. 简要总结
`,
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

          if (currentSection === 'issues') {
            issues.push(line);
          } else if (currentSection === 'suggestions') {
            suggestions.push(line);
          } else if (currentSection === 'summary') {
            summary += line + ' ';
          }
        }

        results.push({
          issues: issues.length ? issues : ['未发现明显问题'],
          suggestions: suggestions.length ? suggestions : ['无具体改进建议'],
          summary: summary || '代码质量良好',
          fileName: change.file,
        });
      } catch (error) {
        console.error(`审查文件 ${change.file} 失败:`, error);
        results.push({
          issues: [`审查文件 ${change.file} 时出错: ${error instanceof Error ? error.message : String(error)}`],
          suggestions: ['请尝试单独审查此文件。'],
          summary: '审查过程中出现错误',
          fileName: change.file,
        });
      }
    }

    return results;
  }
}
