#!/usr/bin/env node

/**
 * CLI命令行入口文件
 */

import { Command } from 'commander';
import figlet from 'figlet';
import chalk from 'chalk';
import { checkCommand, inspectCommand, configCommand, depsAnalysisCommand } from './commands/index.js';
import { readConfig, getLocalizedText } from './utils.js';
import { Language } from '@t-care/utils';
// 导入包信息获取版本号
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// 获取包版本号
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = resolve(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// 读取配置获取默认语言
const config = await readConfig();
const language = config.language || 'zh';
const texts = getLocalizedText(language as Language);

const program = new Command();

// 设置CLI基本信息
program.name('care').version(packageJson.version);

// 自定义帮助文本
program.helpOption('-h, --help', texts.helpOption);
program.helpCommand('help [command]', texts.helpCommand);

// 添加检查未提交文件命令
program
  .command('check')
  .description(texts.checkCommand)
  .option('-d, --detailed', texts.detailedOption, false)
  .option('-f, --format <format>', texts.formatOption, 'text')
  .option('-m, --model <model>', texts.modelOption, '')
  .option('--focus <focus>', texts.focusOption, '')
  .option('--exclude-extensions <extensions>', texts.excludeOption, '.json')
  .option('-l, --language <language>', texts.languageOption, '')
  .action(async (options) => {
    // 读取配置
    const config = await readConfig();

    // 处理扩展名，命令行优先，其次使用配置文件，最后使用默认值
    const excludeExtensions = options.excludeExtensions
      ? options.excludeExtensions.split(',').map((ext: string) => ext.trim())
      : config.excludeExtensions;

    await checkCommand({
      detailed: options.detailed,
      format: options.format,
      model: options.model,
      focus: options.focus,
      verbose: false,
      structured: options.format === 'json',
      excludeExtensions,
      language: options.language || config.language,
    });
  });

// 添加检查指定文件命令
program
  .command('inspect')
  .description(texts.inspectCommand)
  .argument('<files...>', texts.filesList)
  .option('-d, --detailed', texts.detailedOption, false)
  .option('-f, --format <format>', texts.formatOption, 'text')
  .option('-m, --model <model>', texts.modelOption, '')
  .option('--focus <focus>', texts.focusOption, '')
  .option('--exclude-extensions <extensions>', texts.excludeOption, '.json')
  .option('-l, --language <language>', texts.languageOption, '')
  .action(async (files, options) => {
    // 读取配置
    const config = await readConfig();

    // 处理扩展名，命令行优先，其次使用配置文件，最后使用默认值
    const excludeExtensions = options.excludeExtensions
      ? options.excludeExtensions.split(',').map((ext: string) => ext.trim())
      : config.excludeExtensions;

    await inspectCommand({
      files,
      detailed: options.detailed,
      format: options.format,
      model: options.model,
      focus: options.focus,
      verbose: false,
      structured: options.format === 'json',
      excludeExtensions,
      language: options.language || config.language,
    });
  });

// 添加配置管理命令
program
  .command('config')
  .description(texts.configCommand)
  .option('--init [location]', texts.initOption)
  .option('--show', texts.showOption)
  .option('-l, --language <language>', texts.languageOption, '')
  .action(async (options) => {
    // 读取配置
    const config = await readConfig();
    const language = options.language || config.language;

    const result = await configCommand({
      ...options,
      language,
    });

    // 如果需要显示帮助，则找到config命令并显示帮助
    if (result.showHelp) {
      program.commands.find((cmd) => cmd.name() === 'config')?.help();
    }
  });

// 添加依赖分析命令
program
  .command('deps-analysis')
  .description(texts.depsAnalysisCommand)
  .option('-i, --incremental', texts.incrementalOption, true)
  .option('--vue', texts.vueOption, false)
  .action(async (options) => {
    await depsAnalysisCommand(options);
  });

// 解析命令行参数前打印标语
const title = figlet.textSync('CARE', { font: 'Slant', horizontalLayout: 'fitted' });
const titleLines = title.split('\n');
const byAuthor = 'by qiushui7';

if (titleLines.length > 0) {
  const lastLineIndex = titleLines.length - 1;
  for (let i = lastLineIndex; i >= 0; i--) {
    if (titleLines[i].trim().length > 0) {
      const padding = ' '.repeat(Math.max(2, 50 - titleLines[i].length));
      titleLines[i] = titleLines[i] + padding + chalk.cyan.dim(byAuthor);
      break;
    }
  }
}

console.log(chalk.cyan(titleLines.join('\n')));
console.log(chalk.yellow(texts.programDescription + '\n'));

// 解析命令行参数
program.parse();

/**
 * 主要导出，用于直接在JS/TS代码中使用CLI功能
 */
export { checkCommand, inspectCommand, configCommand, depsAnalysisCommand };
