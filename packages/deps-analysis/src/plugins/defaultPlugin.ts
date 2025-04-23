import * as ts from 'typescript';
import { AnalysisPlugin, AnalysisPluginCreator } from '../types';
import { updateCallRecord, createDiagnosisInfo } from './utils';

export const defaultPlugin: AnalysisPluginCreator = function (context: any): AnalysisPlugin {
  const mapName = 'apiMap';
  // 在分析实例上下文挂载副作用
  context[mapName] = {};

  function isApiCheck(
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
    line: number
  ): boolean {
    try {
      // 默认插件接收所有API调用
      updateCallRecord(context, mapName, depName, apiName, matchImportItem, filePath, projectName, httpRepo, line);
      return true; // 命中规则，终止执行后序插件
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
      return false; // 插件执行报错，继续执行后序插件
    }
  }

  return {
    mapName,
    checkFn: isApiCheck,
    afterHook: null,
  };
};
