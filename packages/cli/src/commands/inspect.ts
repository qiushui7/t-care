/**
 * 检查指定文件的命令模块
 */

import { createGitCodeReviewService } from '@t-care/core';
import {
  printError,
  printSuccess,
  formatReviewResult,
  createSpinner,
  toJson,
  readConfig,
  getLocalizedText,
} from '../utils';
import { CommandOptions, CommandResult } from '../types';
import { Language } from '@t-care/utils';
import fs from 'fs/promises';
import path from 'path';

/**
 * 检查文件是否存在
 * @param filePath 文件路径
 * @returns 是否存在
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile();
  } catch (error) {
    return false;
  }
}

/**
 * 检查指定文件
 * @param options 命令选项
 * @returns 命令结果
 */
export async function inspectCommand(options: CommandOptions): Promise<CommandResult> {
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

    // 验证文件参数
    if (!options.files || options.files.length === 0) {
      printError(texts.noOperationSpecified, language as Language);
      return { success: false, error: '未指定文件路径' };
    }

    const spinner = createSpinner(texts.loadingConfig);
    spinner.start();

    // 设置环境变量
    if (config.openaiKey && !process.env.OPENAI_API_KEY) {
      process.env.OPENAI_API_KEY = config.openaiKey;
    }

    spinner.text = texts.checkingSpecificFiles(options.files.length);

    // 验证文件存在
    const validFiles: string[] = [];
    for (const file of options.files) {
      const filePath = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);
      if (await fileExists(filePath)) {
        validFiles.push(filePath);
      } else {
        spinner.warn(texts.fileNotExist(file));
      }
    }

    if (validFiles.length === 0) {
      spinner.fail(texts.noValidFiles);
      return { success: false, error: texts.allFilesNotExist };
    }

    // 创建代码审查服务
    const reviewService = createGitCodeReviewService({
      model,
      detailed,
      focus,
      excludeExtensions,
      language,
    });

    // 执行检查
    const results = await reviewService.inspectFiles(validFiles, {
      model,
      detailed,
      focus,
      language,
    });

    spinner.succeed(texts.checkCompleted);

    // 格式化并显示结果
    if (options.format === 'json') {
      console.log(toJson(results));
    } else {
      results.forEach((result) => {
        console.log(formatReviewResult(result, detailed, language as Language));
      });
    }

    printSuccess(texts.totalChecked(validFiles.length), language as Language);
    return { success: true, data: results };
  } catch (error) {
    const config = await readConfig();
    const language = options.language || config.language;
    const texts = getLocalizedText(language as Language);
    printError(texts.inspectFailed(error instanceof Error ? error.message : String(error)), language as Language);
    return { success: false, error: String(error) };
  }
}
