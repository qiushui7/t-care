import { glob } from 'glob';
import path from 'path';
import fs from 'fs';

export const scanFileVue = async (scanPath: string): Promise<string[]> => {
  const baseDir = process.cwd();
  const vuePattern = path.join(baseDir, `${scanPath}/**/*.vue`);
  return collectGlobResults(vuePattern);
};

/**
 * 扫描路径下的所有TypeScript文件
 * @param scanPath 扫描路径
 * @returns 所有TypeScript和TypeScript React文件路径
 */
export const scanFileTs = async (scanPath: string): Promise<string[]> => {
  const baseDir = process.cwd();
  const tsPattern = path.join(baseDir, `${scanPath}/**/*.ts`);
  const tsxPattern = path.join(baseDir, `${scanPath}/**/*.tsx`);

  // 使用Promise.all并行处理两个glob模式
  const [tsFiles, tsxFiles] = await Promise.all([collectGlobResults(tsPattern), collectGlobResults(tsxPattern)]);

  // 合并结果并返回
  return [...tsFiles, ...tsxFiles];
};

/**
 * 使用glob包收集所有匹配的文件路径
 * @param pattern 匹配模式
 * @returns 文件路径数组
 */
async function collectGlobResults(pattern: string): Promise<string[]> {
  // 使用glob的原生Promise API
  return glob(pattern);
}

export const getCode = function (fileName: string) {
  try {
    const code = fs.readFileSync(fileName, 'utf-8');
    return code;
  } catch (e) {
    throw e;
  }
};

export const writeTsFile = function (content: string, fileName: string) {
  try {
    fs.writeFileSync(path.join(process.cwd(), `${fileName}.ts`), content, 'utf8');
  } catch (e) {
    throw e;
  }
};
