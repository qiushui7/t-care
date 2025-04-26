import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';

/**
 * 将导入语句中的模块说明符解析为实际文件路径
 * @param importPath 导入路径字符串，如 './components/Button' 或 'react'
 * @param containingFile 当前文件的绝对路径
 * @param compilerOptions 编译选项
 * @returns 解析后的绝对文件路径，如果无法解析则返回null
 */
export function resolveModulePath(
  importPath: string,
  containingFile: string,
  compilerOptions: ts.CompilerOptions = {}
): string | null {
  // 创建模拟的宿主对象
  const compilerHost = ts.createCompilerHost(compilerOptions);

  const originalFileExists = compilerHost.fileExists;
  compilerHost.fileExists = (fileName) => {
    // 检查原始文件名和追加.vue后的文件名
    if (originalFileExists(fileName)) {
      return true;
    }
    // 如果含有.vue则截断文件后缀
    if (fileName.includes('.vue')) {
      const parts = fileName.split('.');
      parts.pop();
      const fileNameWithoutExt = parts.join('.');
      if (originalFileExists(fileNameWithoutExt)) {
        return true;
      }
    } else {
      fileName = fileName + '.vue';
      if (originalFileExists(fileName)) {
        return true;
      }
    }
    return false;
  };

  // 使用TypeScript的模块解析逻辑
  const moduleResolution = ts.resolveModuleName(importPath, containingFile, compilerOptions, compilerHost);

  // 检查是否成功解析
  if (moduleResolution.resolvedModule) {
    return moduleResolution.resolvedModule.resolvedFileName;
  }

  return null;
}
