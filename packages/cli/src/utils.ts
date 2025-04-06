/**
 * CLI工具函数
 */

import chalk from 'chalk';
import figures from 'figures';
import ora from 'ora';
import boxen from 'boxen';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { CodeReviewResult } from '@t-care/core';

/**
 * 默认配置
 */
export const DEFAULT_CONFIG = {
  model: 'gpt-4o-mini',
  openaiKey: '',
  detailed: false,
  focus: 'all',
  excludeExtensions: ['.json'], // 默认排除JSON文件
};

/**
 * 配置文件位置
 */
export const CONFIG_PATHS = [
  path.join(process.cwd(), '.carerc.json'),
  path.join(process.cwd(), '.care', 'config.json'),
  path.join(os.homedir(), '.carerc.json'),
  path.join(os.homedir(), '.care', 'config.json'),
];

/**
 * 读取配置文件
 * @returns 配置对象
 */
export async function readConfig(): Promise<typeof DEFAULT_CONFIG> {
  let config = { ...DEFAULT_CONFIG };

  // 首先尝试从环境变量获取OpenAI密钥
  if (process.env.OPENAI_API_KEY) {
    config.openaiKey = process.env.OPENAI_API_KEY;
  }

  // 按顺序检查配置文件是否存在
  for (const configPath of CONFIG_PATHS) {
    try {
      const fileContent = await fs.readFile(configPath, 'utf-8');
      const fileConfig = JSON.parse(fileContent);

      config = { ...config, ...fileConfig };
      break;
    } catch (error) {
      // 如果文件不存在或格式不正确，继续检查下一个位置
      continue;
    }
  }

  return config;
}

/**
 * 创建默认配置文件
 * @param configPath 配置文件路径
 */
export async function createDefaultConfig(configPath: string): Promise<void> {
  try {
    // 确保目录存在
    const dir = path.dirname(configPath);
    await fs.mkdir(dir, { recursive: true });

    // 写入默认配置
    await fs.writeFile(
      configPath,
      JSON.stringify(
        {
          openaiKey: 'your_openai_api_key_here',
          model: 'gpt-4o-mini',
          detailed: false,
          focus: 'all',
          /** 排除的文件扩展名 */
          excludeExtensions: ['.json'],
        },
        null,
        2
      )
    );

    printSuccess(`已在 ${configPath} 创建默认配置文件`);
  } catch (error) {
    printError(`无法创建配置文件: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 打印错误信息
 * @param message 错误信息
 */
export function printError(message: string): void {
  console.error(`${chalk.red(figures.cross)} ${chalk.red('错误:')} ${message}`);
}

/**
 * 打印成功信息
 * @param message 成功信息
 */
export function printSuccess(message: string): void {
  console.log(`${chalk.green(figures.tick)} ${message}`);
}

/**
 * 打印信息
 * @param message 信息内容
 */
export function printInfo(message: string): void {
  console.log(`${chalk.blue(figures.info)} ${message}`);
}

/**
 * 打印警告信息
 * @param message 警告信息
 */
export function printWarning(message: string): void {
  console.warn(`${chalk.yellow(figures.warning)} ${chalk.yellow('警告:')} ${message}`);
}

/**
 * 创建加载动画
 * @param text 加载文本
 * @returns 加载动画实例
 */
export function createSpinner(text: string): ReturnType<typeof ora> {
  return ora({
    text,
    spinner: 'dots',
    color: 'cyan',
  });
}

/**
 * 格式化审查结果
 * @param result 审查结果
 * @param detailed 是否显示详细信息
 * @returns 格式化后的文本
 */
export function formatReviewResult(result: CodeReviewResult, detailed: boolean = false): string {
  let output = '';

  // 显示文件名
  if (result.fileName) {
    output += chalk.bold.blue(`\n文件: ${result.fileName}`) + '\n';
  }

  if (result.issues && result.issues.length > 0) {
    output += chalk.bold('\n问题:') + '\n';
    result.issues.forEach((issue, index) => {
      output += `${chalk.red(figures.pointer)} ${issue}\n`;
    });
  }

  if (result.suggestions && result.suggestions.length > 0) {
    output += chalk.bold('\n建议:') + '\n';
    result.suggestions.forEach((suggestion, index) => {
      output += `${chalk.green(figures.pointer)} ${suggestion}\n`;
    });
  }

  if (result.summary) {
    output += chalk.bold('\n总结:') + '\n';
    output += `${result.summary}\n`;
  }

  return boxen(output, {
    padding: 1,
    margin: 1,
    borderColor: 'cyan',
    borderStyle: 'round',
  });
}

/**
 * 将对象转为JSON字符串
 * @param obj 对象
 * @returns JSON字符串
 */
export function toJson(obj: any): string {
  return JSON.stringify(obj, null, 2);
}
