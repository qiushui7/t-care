import * as ts from 'typescript';
import { AnalysisPlugin, AnalysisPluginCreator } from '../types';
import { updateCallRecord, createDiagnosisInfo } from '../utils';

export const methodPlugin: AnalysisPluginCreator = function (context: any): AnalysisPlugin {
  const mapName = 'methodMap';
  context[mapName] = {};

  function isMethodCheck(
    context: any,
    tsCompiler: typeof ts,
    node: ts.Node,
    depth: number,
    depName: string,
    apiName: string,
    matchImportItem: { origin: string | null; [key: string]: any },
    filePath: string,
    projectName: string,
    httpRepo: string,
    line: number,
    absolutePath: string
  ): boolean {
    try {
      if (node.parent && ts.isCallExpression(node.parent)) {
        // 存在于函数调用表达式中
        if (node.parent.expression.pos === node.pos && node.parent.expression.end === node.end) {
          // 命中函数名method检测
          updateCallRecord(
            context,
            mapName,
            depName,
            apiName,
            matchImportItem,
            filePath,
            projectName,
            httpRepo,
            line,
            absolutePath
          );
          return true; // true: 命中规则, 终止执行后序插件
        }
      }
      return false; // false: 未命中检测逻辑, 继续执行后序插件
    } catch (e) {
      const info = createDiagnosisInfo(
        projectName,
        matchImportItem,
        depName,
        apiName,
        httpRepo,
        filePath,
        line,
        e as Error
      );
      context.addDiagnosisInfo(info);
      return false; // false: 插件执行报错, 继续执行后序插件
    }
  }

  return {
    mapName,
    checkFn: isMethodCheck,
    afterHook: null,
  };
};
