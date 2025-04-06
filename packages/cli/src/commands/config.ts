/**
 * 配置管理命令模块
 */

import { printError, printSuccess, toJson, readConfig, createDefaultConfig } from '../utils';
import { CommandOptions, CommandResult } from '../types';
import path from 'path';
import os from 'os';

/**
 * 配置管理命令
 * @param options 命令选项
 * @returns 命令结果
 */
export async function configCommand(options: CommandOptions): Promise<CommandResult> {
  try {
    if (options.init) {
      const configPath =
        options.init === 'global' ? path.join(os.homedir(), '.carerc.json') : path.join(process.cwd(), '.carerc.json');

      await createDefaultConfig(configPath);
      return { success: true, message: `配置文件已创建: ${configPath}` };
    }

    if (options.show) {
      const config = await readConfig();
      console.log(toJson(config));
      printSuccess('当前配置');
      return { success: true, data: config };
    }

    // 如果没有指定选项，返回一个错误
    return {
      success: false,
      error: '未指定操作，请使用 --init 或 --show 选项',
      showHelp: true,
    };
  } catch (error) {
    printError(`配置操作失败: ${error instanceof Error ? error.message : String(error)}`);
    return { success: false, error: String(error) };
  }
}
