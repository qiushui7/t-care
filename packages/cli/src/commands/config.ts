/**
 * 配置管理命令模块
 */

import { printError, printSuccess, toJson, readConfig, createDefaultConfig, getLocalizedText } from '../utils';
import { CommandOptions, CommandResult } from '../types';
import { Language } from '@t-care/utils';
import path from 'path';
import os from 'os';

/**
 * 配置管理命令
 * @param options 命令选项
 * @returns 命令结果
 */
export async function configCommand(options: CommandOptions): Promise<CommandResult> {
  try {
    // 读取配置文件获取语言设置
    const config = await readConfig();
    const language = options.language || config.language;
    const texts = getLocalizedText(language as Language);

    if (options.init) {
      const configPath =
        options.init === 'global' ? path.join(os.homedir(), '.carerc.json') : path.join(process.cwd(), '.carerc.json');

      await createDefaultConfig(configPath);
      return { success: true, message: texts.configCreated(configPath) };
    }

    if (options.show) {
      console.log(toJson(config));
      printSuccess(texts.currentConfig, language as Language);
      return { success: true, data: config };
    }

    // 如果没有指定选项，返回一个错误
    return {
      success: false,
      error: texts.noOperationSpecified,
      showHelp: true,
    };
  } catch (error) {
    // 读取配置文件获取语言设置
    const config = await readConfig();
    const language = options.language || config.language;
    const texts = getLocalizedText(language as Language);

    printError(texts.configFailed(error instanceof Error ? error.message : String(error)), language as Language);
    return { success: false, error: String(error) };
  }
}
