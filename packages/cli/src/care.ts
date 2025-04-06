#!/usr/bin/env node

/**
 * CLI命令行入口文件
 */

import { Command } from 'commander';
import { checkCommand, inspectCommand, configCommand } from './commands/index.js';
import { readConfig } from './utils.js';

const program = new Command();

// 设置CLI基本信息
program.name('care').description('代码审查工具').version('1.0.0');

// 添加检查未提交文件命令
program
  .command('check')
  .description('检查未提交的代码文件')
  .option('-d, --detailed', '显示详细审查结果', false)
  .option('-f, --format <format>', '输出格式 (text|json)', 'text')
  .option('-m, --model <model>', '使用的模型', '')
  .option('--focus <focus>', '审查重点 (性能|安全|可读性|最佳实践)', '')
  .option('--exclude-extensions <extensions>', '排除的文件扩展名 (例如: .json,.md)', '.json')
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
    });
  });

// 添加检查指定文件命令
program
  .command('inspect')
  .description('检查指定的代码文件')
  .argument('<files...>', '文件路径列表')
  .option('-d, --detailed', '显示详细审查结果', false)
  .option('-f, --format <format>', '输出格式 (text|json)', 'text')
  .option('-m, --model <model>', '使用的模型', '')
  .option('--focus <focus>', '审查重点 (性能|安全|可读性|最佳实践)', '')
  .option('--exclude-extensions <extensions>', '排除的文件扩展名 (例如: .json,.md)', '.json')
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
    });
  });

// 添加配置管理命令
program
  .command('config')
  .description('管理配置')
  .option('--init [location]', '初始化配置文件 (local|global)', 'local')
  .option('--show', '显示当前配置')
  .action(async (options) => {
    const result = await configCommand(options);

    // 如果需要显示帮助，则找到config命令并显示帮助
    if (result.showHelp) {
      program.commands.find((cmd) => cmd.name() === 'config')?.help();
    }
  });

// 解析命令行参数
program.parse();

/**
 * 主要导出，用于直接在JS/TS代码中使用CLI功能
 */
export { checkCommand, inspectCommand, configCommand };
