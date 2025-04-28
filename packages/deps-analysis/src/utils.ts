import { DepsAnalysis } from './analysis';

/**
 * 创建或更新调用记录
 *
 * @param context 分析上下文
 * @param mapName 映射名称
 * @param depName 依赖名称
 * @param apiName API名称
 * @param matchImportItem 匹配的导入项
 * @param filePath 文件路径
 * @param projectName 项目名称
 * @param httpRepo HTTP仓库
 * @param line 行号
 */
export function updateCallRecord(
  context: DepsAnalysis,
  mapName: string,
  depName: string,
  apiName: string,
  matchImportItem: any,
  filePath: string,
  projectName: string,
  httpRepo: string,
  line: number,
  absolutePath: string
): void {
  if (context.incremental) {
    try {
      cacheCallRecord(
        context.fileCache[absolutePath],
        mapName,
        depName,
        apiName,
        matchImportItem,
        filePath,
        projectName,
        httpRepo,
        line
      );
    } catch (e) {
      console.error('cacheCallRecord error', absolutePath);
    }
  }
  // 确保depName层级已初始化
  if (!context[mapName][depName]) {
    context[mapName][depName] = {};
  }

  // 确保apiName层级已初始化
  if (!context[mapName][depName][apiName]) {
    context[mapName][depName][apiName] = {
      callNum: 1,
      callFiles: {},
    };
  } else {
    context[mapName][depName][apiName].callNum++;
  }

  // 处理callFiles记录
  const callFiles = context[mapName][depName][apiName].callFiles;
  if (!callFiles[filePath]) {
    callFiles[filePath] = {
      projectName,
      callOrigin: matchImportItem.origin,
      callNum: 1,
      httpRepo,
      lines: [line],
    };
  } else if (!callFiles[filePath].lines.includes(line)) {
    callFiles[filePath].lines.push(line);
    callFiles[filePath].callNum++;
  } else {
    callFiles[filePath].callNum++;
  }
}

export function cacheCallRecord(
  cache: any,
  mapName: string,
  depName: string,
  apiName: string,
  matchImportItem: any,
  filePath: string,
  projectName: string,
  httpRepo: string,
  line: number
): void {
  // 确保depName层级已初始化
  if (!cache[mapName][depName]) {
    cache[mapName][depName] = {};
  }

  // 确保apiName层级已初始化
  if (!cache[mapName][depName][apiName]) {
    cache[mapName][depName][apiName] = {
      callNum: 1,
      callFiles: {},
    };
  } else {
    cache[mapName][depName][apiName].callNum++;
  }

  // 处理callFiles记录
  const callFiles = cache[mapName][depName][apiName].callFiles;
  if (!callFiles[filePath]) {
    callFiles[filePath] = {
      projectName,
      callOrigin: matchImportItem.origin,
      httpRepo,
      lines: [line],
    };
  } else if (!callFiles[filePath].lines.includes(line)) {
    callFiles[filePath].lines.push(line);
  }
}

/**
 * 创建诊断信息对象
 *
 * @param projectName 项目名称
 * @param matchImportItem 匹配的导入项
 * @param depName 依赖名称
 * @param apiName API名称
 * @param httpRepo HTTP仓库
 * @param filePath 文件路径
 * @param line 行号
 * @param error 错误对象
 * @returns 诊断信息对象
 */
export function createDiagnosisInfo(
  projectName: string,
  matchImportItem: any,
  depName: string,
  apiName: string,
  httpRepo: string,
  filePath: string,
  line: number,
  error: Error
): any {
  return {
    projectName,
    matchImportItem,
    depName,
    apiName,
    httpRepo: httpRepo + filePath.split('&')[1] + '#L' + line,
    file: filePath.split('&')[1],
    line,
    stack: error.stack,
  };
}

/**
 * 深度合并对象方法
 * 如果目标对象不包含源对象的key，则直接新增
 * 如果包含且值为简单数据类型，则覆盖
 * 如果包含且值为数组，则合并数组并去重
 * 如果包含且值为对象，则递归合并
 * @param target 目标对象
 * @param source 源对象
 * @returns 合并后的对象
 */
export function deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
  if (!source || typeof source !== 'object') return target;

  const result = { ...target };

  Object.entries(source).forEach(([key, sourceValue]) => {
    // 如果目标对象不包含该key，直接赋值
    if (!(key in result)) {
      result[key] = sourceValue;
      return;
    }

    const targetValue = result[key];

    // 处理数组：合并并去重
    if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
      result[key] = [...new Set([...targetValue, ...sourceValue])];
      return;
    }

    // 处理对象：递归合并
    if (
      sourceValue &&
      typeof sourceValue === 'object' &&
      targetValue &&
      typeof targetValue === 'object' &&
      !Array.isArray(sourceValue) &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(targetValue, sourceValue);
      return;
    }
    if (key === 'callNum') {
      result[key] += sourceValue;
      return;
    }
    // 简单数据类型或其他情况：直接覆盖
    result[key] = sourceValue;
  });

  return result;
}
