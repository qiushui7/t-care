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
import { getLocalization, Language } from '@t-care/utils';

/**
 * 默认配置
 */
export const DEFAULT_CONFIG = {
  model: 'gpt-4o-mini',
  openaiKey: '',
  detailed: false,
  focus: 'all',
  excludeExtensions: ['.json'], // 默认排除JSON文件
  language: 'zh', // 输出语言，支持zh(中文)或en(英文)
  depsAnalysis: {
    scanSource: [],
    analysisTarget: [],
    blackList: [],
    browserApis: [],
    isScanVue: false,
  },
};
/**
 * 获取本地化文本的简便方法
 * 这是一个包装函数，统一使用cli子键下的本地化文本
 * @param lang 语言代码
 */
export function getLocalizedText(lang: Language = 'zh') {
  return getLocalization(lang).cli;
}

/**
 * 配置文件位置
 */
export const CONFIG_PATHS = [
  path.join(process.cwd(), '.carerc.js'),
  path.join(process.cwd(), '.care', 'config.js'),
  path.join(os.homedir(), '.carerc.js'),
  path.join(os.homedir(), '.care', 'config.js'),
];

/**
 * 导入JavaScript配置文件
 * @param configPath 配置文件路径
 * @returns 配置对象
 */
export async function importJsConfig(configPath: string): Promise<any> {
  try {
    // 检查文件是否存在
    try {
      await fs.access(configPath);
    } catch {
      throw new Error(`配置文件不存在: ${configPath}`);
    }

    // 确保是JavaScript文件
    if (!configPath.endsWith('.js')) {
      throw new Error(`不支持的配置文件格式: ${configPath}，只支持JavaScript格式(.js)`);
    }

    // 使用ESM动态导入JavaScript文件
    try {
      // 将路径转换为URL格式以支持ESM导入
      const fileUrl = `file://${configPath}`;
      const module = await import(fileUrl);
      return module.default || module;
    } catch (importError) {
      throw new Error(
        `导入JS配置文件失败: ${importError instanceof Error ? importError.message : String(importError)}`
      );
    }
  } catch (error) {
    throw new Error(`导入JS配置文件失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

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
      const fileConfig = await importJsConfig(configPath);
      config = { ...config, ...fileConfig };
      break;
    } catch (error) {
      // 如果文件不存在或格式不正确，继续检查下一个位置
      console.log(error);
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

    // 获取模板文件路径
    const templatePath = path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      '../templates/carerc.js.template'
    );

    try {
      // 读取模板文件内容
      const templateContent = await fs.readFile(templatePath, 'utf-8');

      // 写入配置文件
      await fs.writeFile(configPath, templateContent);

      const config = await readConfig();
      const texts = getLocalizedText(config.language as Language);
      printSuccess(texts.configCreated(configPath), config.language as Language);
    } catch (templateError) {
      // 如果无法读取模板文件，使用默认内容
      printWarning(
        `无法读取模板文件: ${templateError instanceof Error ? templateError.message : String(templateError)}`
      );

      const defaultJsContent = `
/**
 * Care Configuration File
 */
export default {
  openaiKey: 'your_openai_api_key_here',
  model: 'gpt-4o-mini',
  detailed: false,
  focus: 'all',
  // Excluded file extensions
  excludeExtensions: ['.json'],
  // Output language (zh: Chinese, en: English)
  language: 'zh',
  // Dependency analysis configuration
  depsAnalysis: {
    // Scan sources
    scanSource: [
      {
        name: 'Default Project',
        include: ['src'],
        exclude: ['**/node_modules/**'],
        httpRepo: '',
        format: (str) => {
          return str.replace('Default Project', 'Your Project Name');
        },
        packageJsonPath: './package.json',
        tsConfigPath: './tsconfig.json',
      }
    ],
    // Analysis targets
    analysisTarget: [],
    // Blacklist
    blackList: [],
    // Browser APIs
    browserApis: [],
    // Whether to scan Vue files
    isScanVue: false,
  },
};
`;
      await fs.writeFile(configPath, defaultJsContent);

      const config = await readConfig();
      const texts = getLocalizedText(config.language as Language);
      printSuccess(texts.configCreated(configPath), config.language as Language);
    }
  } catch (error) {
    const config = await readConfig();
    const texts = getLocalizedText(config.language as Language);
    printError(
      texts.cannotCreateConfig(error instanceof Error ? error.message : String(error)),
      config.language as Language
    );
  }
}

/**
 * 打印错误信息
 * @param message 错误信息
 * @param language 语言
 */
export function printError(message: string, language: Language = 'zh'): void {
  const texts = getLocalizedText(language);
  console.error(`${chalk.red(figures.cross)} ${chalk.red(texts.error)} ${message}`);
}

/**
 * 打印成功信息
 * @param message 成功信息
 * @param language 语言
 */
export function printSuccess(message: string, language: Language = 'zh'): void {
  console.log(`${chalk.green(figures.tick)} ${message}`);
}

/**
 * 打印信息
 * @param message 信息内容
 * @param language 语言
 */
export function printInfo(message: string, language: Language = 'zh'): void {
  console.log(`${chalk.blue(figures.info)} ${message}`);
}

/**
 * 打印警告信息
 * @param message 警告信息
 * @param language 语言
 */
export function printWarning(message: string, language: Language = 'zh'): void {
  const texts = getLocalizedText(language);
  console.warn(`${chalk.yellow(figures.warning)} ${chalk.yellow(texts.warning)} ${message}`);
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
 * @param language 语言
 * @returns 格式化后的文本
 */
export function formatReviewResult(
  result: CodeReviewResult,
  detailed: boolean = false,
  language: Language = 'zh'
): string {
  let output = '';
  const texts = getLocalization(language).review;

  // 显示文件名
  if (result.fileName) {
    output += chalk.bold.blue(`\n${texts.file}: ${result.fileName}`) + '\n';
  }

  if (result.issues && result.issues.length > 0) {
    output += chalk.bold(`\n${texts.issues}:`) + '\n';
    result.issues.forEach((issue, index) => {
      output += `${chalk.red(figures.pointer)} ${issue}\n`;
    });
  }

  if (result.suggestions && result.suggestions.length > 0) {
    output += chalk.bold(`\n${texts.suggestions}:`) + '\n';
    result.suggestions.forEach((suggestion, index) => {
      output += `${chalk.green(figures.pointer)} ${suggestion}\n`;
    });
  }

  if (result.summary) {
    output += chalk.bold(`\n${texts.summary}:`) + '\n';
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
