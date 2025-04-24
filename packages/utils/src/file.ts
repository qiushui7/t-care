import { glob } from 'glob';
import path from 'path';
import fs from 'fs';

/**
 * 扫描路径下的所有Vue文件
 * @param scanPath 扫描路径
 * @param exclude 排除模式数组
 * @returns 所有Vue文件路径
 */
export const scanFileVue = async (scanPath: string, exclude?: string[]): Promise<string[]> => {
  const baseDir = process.cwd();
  const vuePattern = path.join(baseDir, `${scanPath}/**/*.vue`);
  return collectGlobResults(vuePattern, exclude);
};

/**
 * 扫描路径下的所有TypeScript文件
 * @param scanPath 扫描路径
 * @param exclude 排除模式数组
 * @returns 所有TypeScript和TypeScript React文件路径
 */
export const scanFileTs = async (scanPath: string, exclude?: string[]): Promise<string[]> => {
  const baseDir = process.cwd();
  const tsPattern = path.join(baseDir, `${scanPath}/**/*.ts`);
  const tsxPattern = path.join(baseDir, `${scanPath}/**/*.tsx`);

  // 使用Promise.all并行处理两个glob模式
  const [tsFiles, tsxFiles] = await Promise.all([
    collectGlobResults(tsPattern, exclude),
    collectGlobResults(tsxPattern, exclude),
  ]);

  // 合并结果并返回
  return [...tsFiles, ...tsxFiles];
};

/**
 * 使用glob包收集所有匹配的文件路径
 * @param pattern 匹配模式
 * @param exclude 排除模式数组
 * @returns 文件路径数组
 */
async function collectGlobResults(pattern: string, exclude?: string[]): Promise<string[]> {
  // 如果有排除模式，使用手动过滤
  if (exclude && exclude.length > 0) {
    // 先获取所有匹配的文件
    const files = await glob(pattern);

    // 手动过滤掉排除的文件
    return files.filter((file) => {
      for (const excludePattern of exclude) {
        // 如果是目录路径且以/结尾
        if (excludePattern.endsWith('/') && file.includes(excludePattern)) {
          return false;
        }
        // 如果是带*的通配符模式
        else if (excludePattern.includes('*')) {
          const regexPattern = excludePattern.replace(/\*/g, '.*');
          const regex = new RegExp(regexPattern);
          if (regex.test(file)) {
            return false;
          }
        }
        // 精确匹配
        else if (file.includes(excludePattern)) {
          return false;
        }
      }
      return true;
    });
  }

  // 如果没有排除模式，直接返回所有匹配的文件
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
