import * as ts from 'typescript';
import { AnalysisPlugin, AnalysisPluginCreator } from '../types';
import { updateCallRecord, createDiagnosisInfo } from '../utils';

export const typePlugin: AnalysisPluginCreator = function (context: any): AnalysisPlugin {
  const mapName = 'typeMap';
  // 在分析实例上下文挂载副作用
  context[mapName] = {};

  function isTypeCheck(
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
      // 只有在节点为类型引用时才匹配
      if (node.parent && ts.isTypeReferenceNode(node.parent)) {
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
        return true; // 命中规则，终止执行后序插件
      }
      return false; // 未命中检测逻辑，继续执行后序插件
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
    checkFn: isTypeCheck,
    afterHook: null,
  };
};
