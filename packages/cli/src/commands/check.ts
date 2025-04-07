/**
 * 检查未提交文件的命令模块
 */

import { createGitCodeReviewService } from '@t-care/core';
import {
  printError,
  printSuccess,
  printInfo,
  formatReviewResult,
  createSpinner,
  toJson,
  readConfig,
  getLocalizedText,
} from '../utils';
import { CommandOptions, CommandResult } from '../types';
import { Language } from '@t-care/utils';

/**
 * 检查未提交文件
 * @param options 命令选项
 * @returns 命令结果
 */
export async function checkCommand(options: CommandOptions): Promise<CommandResult> {
  try {
    // 读取配置文件
    const config = await readConfig();

    // 命令行选项优先于配置文件
    const model = options.model || config.model;
    const detailed = options.detailed !== undefined ? options.detailed : config.detailed;
    const focus = options.focus || config.focus;
    const language = options.language || config.language;
    const excludeExtensions = options.excludeExtensions || config.excludeExtensions;

    // 获取本地化文本
    const texts = getLocalizedText(language as Language);

    const spinner = createSpinner(texts.loadingConfig);
    spinner.start();

    // 设置环境变量
    if (config.openaiKey && !process.env.OPENAI_API_KEY) {
      process.env.OPENAI_API_KEY = config.openaiKey;
    }

    spinner.text = texts.checkingFiles;

    // 创建代码审查服务
    const reviewService = createGitCodeReviewService({
      model,
      detailed,
      focus,
      excludeExtensions,
      language,
    });

    // 执行检查
    const results = await reviewService.inspectLocalChanges({
      model,
      detailed,
      focus,
      language,
    });

    spinner.succeed(texts.checkCompleted);

    if (results.length === 0) {
      printInfo(texts.noUncommittedFiles, language as Language);
      return { success: true, data: [] };
    }

    // 格式化并显示结果
    if (options.format === 'json') {
      console.log(toJson(results));
    } else {
      results.forEach((result) => {
        console.log(formatReviewResult(result, detailed, language as Language));
      });
    }

    printSuccess(texts.totalChecked(results.length), language as Language);
    return { success: true, data: results };
  } catch (error) {
    const config = await readConfig();
    const language = options.language || config.language;
    const texts = getLocalizedText(language as Language);
    printError(texts.checkFailed(error instanceof Error ? error.message : String(error)), language as Language);
    return { success: false, error: String(error) };
  }
}
