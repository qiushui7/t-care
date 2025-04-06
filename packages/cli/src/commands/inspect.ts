/**
 * 检查指定文件的命令模块
 */

import { createGitCodeReviewService } from '@t-care/core';
import { printError, printSuccess, printInfo, formatReviewResult, createSpinner, toJson, readConfig } from '../utils';
import { CommandOptions, CommandResult } from '../types';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

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
    // 验证文件参数
    if (!options.files || options.files.length === 0) {
      printError('请指定至少一个文件路径');
      return { success: false, error: '未指定文件路径' };
    }

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

    spinner.text = `正在检查 ${options.files.length} 个文件...`;

    // 验证文件存在
    const validFiles: string[] = [];
    for (const file of options.files) {
      const filePath = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);
      if (await fileExists(filePath)) {
        validFiles.push(filePath);
      } else {
        spinner.warn(`文件不存在: ${file}`);
      }
    }

    if (validFiles.length === 0) {
      spinner.fail('没有找到有效的文件');
      return { success: false, error: '所有指定的文件都不存在' };
    }

    // 创建代码审查服务
    const reviewService = createGitCodeReviewService({
      model,
      detailed,
      focus,
      excludeExtensions,
    });

    // 执行检查
    const results = await reviewService.inspectFiles(validFiles);

    spinner.succeed('检查完成');

    // 格式化并显示结果
    if (options.format === 'json') {
      console.log(toJson(results));
    } else {
      results.forEach((result) => {
        console.log(formatReviewResult(result, detailed));
      });
    }

    printSuccess(`共检查了 ${validFiles.length} 个文件`);
    return { success: true, data: results };
  } catch (error) {
    printError(`检查文件失败: ${error instanceof Error ? error.message : String(error)}`);
    return { success: false, error: String(error) };
  }
}
