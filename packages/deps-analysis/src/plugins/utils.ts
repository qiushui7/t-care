import * as ts from 'typescript';

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
  context: any,
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
  if (!context[mapName][depName]) {
    context[mapName][depName] = {};
  }

  // 确保apiName层级已初始化
  if (!context[mapName][depName][apiName]) {
    context[mapName][depName][apiName] = {
      callNum: 1,
      callOrigin: matchImportItem.origin,
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
