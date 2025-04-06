import { CodeInspectionOptions } from './types';
import { GitCodeReviewService } from './services/git-code-review-service';

/**
 * 创建基于Git的Mastra代码审查服务
 * @param options 服务选项
 * @returns Git代码审查服务
 */
export function createGitCodeReviewService(
  options: CodeInspectionOptions = {
    model: 'gpt-4o-mini',
    detailed: true,
  }
) {
  const { model, detailed = true, focus, excludeExtensions } = options;

  return new GitCodeReviewService(
    {
      model,
      detailed,
      focus,
      includeCodeSnippets: true,
    },
    excludeExtensions
  );
}
