/**
 * 检查未提交文件的命令模块
 */

import { createGitCodeReviewService } from '@t-care/core';
import { printError, printSuccess, printInfo, formatReviewResult, createSpinner, toJson, readConfig } from '../utils';
import { CommandOptions, CommandResult } from '../types';

/**
 * 检查未提交文件
 * @param options 命令选项
 * @returns 命令结果
 */
export async function checkCommand(options: CommandOptions): Promise<CommandResult> {
  try {
    const spinner = createSpinner('正在加载配置...');
    spinner.start();

    // 读取配置文件
    const config = await readConfig();

    // 命令行选项优先于配置文件
    const model = options.model || config.model;
    const detailed = options.detailed !== undefined ? options.detailed : config.detailed;
    const focus = options.focus || config.focus;
    // 命令行选项优先于配置文件
    const excludeExtensions = options.excludeExtensions || config.excludeExtensions;

    // 设置环境变量
    if (config.openaiKey && !process.env.OPENAI_API_KEY) {
      process.env.OPENAI_API_KEY = config.openaiKey;
    }

    spinner.text = '正在检查未提交的文件...';

    // 创建代码审查服务
    const reviewService = createGitCodeReviewService({
      model,
      detailed,
      focus,
      excludeExtensions,
    });

    // 执行检查
    const results = await reviewService.inspectLocalChanges();

    spinner.succeed('检查完成');

    if (results.length === 0) {
      printInfo('没有找到需要检查的未提交文件');
      return { success: true, data: [] };
    }

    // 格式化并显示结果
    if (options.format === 'json') {
      console.log(toJson(results));
    } else {
      results.forEach((result) => {
        console.log(formatReviewResult(result, detailed));
      });
    }

    printSuccess(`共检查了 ${results.length} 个文件`);
    return { success: true, data: results };
  } catch (error) {
    printError(`检查未提交文件失败: ${error instanceof Error ? error.message : String(error)}`);
    return { success: false, error: String(error) };
  }
}
