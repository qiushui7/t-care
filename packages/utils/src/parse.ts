import * as ts from 'typescript';
import { parse, ElementNode, TemplateChildNode } from '@vue/compiler-dom';
import { createHash } from 'crypto';
import { getCode } from './file';
import fs from 'fs';
import path from 'path';
// 生成MD5哈希
function md5(str: string): string {
  return createHash('md5').update(str).digest('hex');
}

// 解析ts文件代码，获取ast，checker
export const parseTs = function (fileName: string, options: ts.CompilerOptions) {
  // 将ts代码转化为AST
  const program = ts.createProgram([fileName], options);
  const ast = program.getSourceFile(fileName);
  const checker = program.getTypeChecker();
  // console.log(ast);
  return { ast, checker };
};

export const parseVue = function (fileName: string, options: ts.CompilerOptions) {
  // 获取vue代码
  const vueCode = getCode(fileName);
  // 解析vue代码
  const result = parse(vueCode);
  const children = result.children;
  // 获取script片段
  let tsCode;
  let baseLine = 0;

  // 遍历查找script标签
  for (const element of children) {
    if (
      'tag' in element &&
      element.tag === 'script' &&
      element.children &&
      element.children.length > 0 &&
      'content' in element.children[0]
    ) {
      tsCode = element.children[0].content;
      baseLine = element.loc.start.line - 1;
      break;
    }
  }

  // 如果没有找到有效的script标签，返回空结果
  if (!tsCode) {
    return { ast: null, checker: null, baseLine: 0 };
  }

  const ts_hash_name = md5(fileName);
  // 创建一个 SourceFile 对象
  const sourceFile = ts.createSourceFile(
    `${ts_hash_name}.ts`,
    tsCode as string,
    ts.ScriptTarget.Latest, // 或者指定其他 ECMAScript 版本
    true // 设置为 true 以指示这是一个独立的 source 文件
  );

  // 创建一个 CompilerHost
  const compilerHost = {
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    getSourceFile: (fileName: string, languageVersion: ts.ScriptTarget) => {
      if (fileName === `${ts_hash_name}.ts`) {
        return sourceFile;
      }
      const fileContent = ts.sys.readFile(fileName);
      return fileContent ? ts.createSourceFile(fileName, fileContent, languageVersion) : undefined;
    },
    getDefaultLibFileName: (options: ts.CompilerOptions) => ts.getDefaultLibFilePath(options),
    writeFile: ts.sys.writeFile,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getDirectories: ts.sys.getDirectories,
    getCanonicalFileName: (fileName: string) => (ts.sys.useCaseSensitiveFileNames ? fileName : fileName.toLowerCase()),
    getNewLine: () => ts.sys.newLine,
    useCaseSensitiveFileNames: () => ts.sys.useCaseSensitiveFileNames,
  };

  // 创建一个 Program
  const program = ts.createProgram({
    rootNames: [`${ts_hash_name}.ts`],
    options,
    host: compilerHost,
  });

  const ast = program.getSourceFile(`${ts_hash_name}.ts`);
  const checker = program.getTypeChecker();

  return { ast, checker, baseLine };
};

export const parseTsConfig = function (fileName: string) {
  const tsConfig = ts.readConfigFile(fileName, ts.sys.readFile);
  return tsConfig;
};

export const parsePackageJson = function (fileName: string) {
  const packageJson = JSON.parse(fs.readFileSync(`${path.join(process.cwd(), fileName)}`, 'utf8'));
  return packageJson;
};
