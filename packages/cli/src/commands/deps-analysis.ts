import { readConfig } from '../utils';
import { DepsAnalysisService } from '@t-care/core';
import fs from 'fs';
import path from 'path';
import { startDepsDisplay, DepsDisplayOptions } from '@t-care/deps-display';
import chalk from 'chalk';
import ora from 'ora';
import { getLocalization, Language } from '@t-care/utils';

interface DepsAnalysisOptions {
  incremental?: boolean;
  vue?: boolean;
}

export async function depsAnalysisCommand(options: DepsAnalysisOptions) {
  // 读取配置文件获取语言设置
  const config = await readConfig();
  const language = config.language as Language;
  const texts = getLocalization(language).depsAnalysis;
  if (options.incremental) {
    config.depsAnalysis.incremental = options.incremental;
  }
  if (options.vue) {
    config.depsAnalysis.isScanVue = options.vue;
  }
  console.log(chalk.bold.blue(`\n${texts.title}\n`));

  const spinner = ora(texts.loadingConfig).start();
  spinner.succeed(chalk.green(texts.configLoaded));

  spinner.text = texts.analyzing;
  spinner.start();

  config.depsAnalysis.cacheDir = path.resolve(process.cwd(), '.care', 'cache');

  const depsAnalysis = new DepsAnalysisService(config.depsAnalysis, language);

  const result = await depsAnalysis.run();
  spinner.succeed(chalk.green(texts.analyzeComplete));

  // 生成结果JSON文件
  spinner.text = texts.generatingReport;
  spinner.start();
  const outputPath = await exportResultToJson(result, language);
  spinner.succeed(chalk.green(texts.reportGenerated));

  // 启动可视化展示
  await startVisualization(outputPath, language);
}

/**
 * 将分析结果导出为JSON文件
 * @param result 分析结果对象
 * @param language 语言设置
 * @returns 返回生成的JSON文件路径
 */
async function exportResultToJson(result: any, language: Language): Promise<string> {
  const texts = getLocalization(language).depsAnalysis;

  try {
    // 创建输出目录（如果不存在）
    const outputDir = path.resolve(process.cwd(), '.care');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 预处理结果对象，处理可能存在的循环引用
    const processedResult = JSON.stringify(
      result,
      (key, value) => {
        // 处理函数和循环引用
        if (typeof value === 'function') {
          return 'Function';
        }
        if (key.startsWith('_') || key === 'fileCache') {
          return undefined;
        }
        return value;
      },
      2
    );

    // 写入JSON文件
    const outputPath = path.join(outputDir, 'deps-analysis-result.json');
    fs.writeFileSync(outputPath, processedResult);

    console.log(chalk.cyan(`✅ ${texts.reportSaved(chalk.underline(outputPath))}`));
    return outputPath;
  } catch (error) {
    console.error(chalk.red(`❌ ${texts.exportError(error instanceof Error ? error.message : String(error))}`));
    throw error;
  }
}

/**
 * 启动依赖可视化展示
 * @param jsonFilePath 生成的依赖分析JSON文件路径
 * @param language 语言设置
 */
async function startVisualization(jsonFilePath: string, language: Language): Promise<void> {
  const texts = getLocalization(language).depsAnalysis;

  try {
    const spinner = ora(chalk.blue(texts.startingService)).start();

    // 定义配置选项
    const options: DepsDisplayOptions = {
      jsonFilePath,
      port: 3080,
      language,
    };

    // 直接调用deps-display包提供的API
    await startDepsDisplay(options);

    spinner.succeed(chalk.green(texts.serviceStarted));
  } catch (error) {
    console.error(chalk.red(`❌ ${texts.serviceStartError(error instanceof Error ? error.message : String(error))}`));
    throw error;
  }
}
