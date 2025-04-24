import { readConfig } from '../utils';
import { DepsAnalysisService } from '@t-care/core';
import fs from 'fs';
import path from 'path';

export async function depsAnalysisCommand() {
  const config = await readConfig();
  const depsAnalysis = new DepsAnalysisService(config.depsAnalysis);
  const result = await depsAnalysis.run();

  // 生成结果JSON文件
  await exportResultToJson(result);
}

/**
 * 将分析结果导出为JSON文件
 * @param result 分析结果对象
 */
async function exportResultToJson(result: any) {
  try {
    // 创建输出目录（如果不存在）
    const outputDir = path.resolve(process.cwd(), '.analysis-output');
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
        return value;
      },
      2
    );

    // 写入JSON文件
    const outputPath = path.join(outputDir, 'deps-analysis-result.json');
    fs.writeFileSync(outputPath, processedResult);

    console.log(`分析结果已保存到：${outputPath}`);
  } catch (error) {
    console.error('导出分析结果时出错:', error);
  }
}
