import * as ts from 'typescript';
import {
  scanFileVue,
  scanFileTs,
  parseVue,
  parseTs,
  parseTsConfig,
  parsePackageJson,
  getLocalization,
  Language,
} from '@t-care/utils';
import { CODEFILETYPE } from './constant';
import { ScanSource, AnalysisPlugin, AnalysisPluginCreator, DepsAnalysisOptions, DiagnosisInfo } from './types';
import { methodPlugin } from './plugins/methodPlugin';
import { typePlugin } from './plugins/typePlugin';
import { defaultPlugin } from './plugins/defaultPlugin';
import { browserPlugin } from './plugins/browserPlugin';
import path from 'path';

// EntryObject接口定义
interface EntryObject {
  name: string;
  httpRepo?: string;
  parse: string[];
  show: string[];
  tsConfigPath: string;
}

// ImportItem接口定义
interface ImportItem {
  depName: string;
  name: string;
  origin: string | null;
  symbolPos: number;
  symbolEnd: number;
  identifierPos: number;
  identifierEnd: number;
  line: number;
}

// ImportItems映射类型
type ImportItemsMap = Record<
  string,
  {
    origin: string | null;
    symbolPos: number;
    symbolEnd: number;
    identifierPos: number;
    identifierEnd: number;
  }
>;

// 属性访问结果
interface PropertyAccessResult {
  baseNode: ts.Node;
  depth: number;
  apiName: string;
}

export class DepsAnalysis {
  // 索引签名，允许使用字符串索引访问
  [key: string]: any;

  // 私有属性
  private _scanSource: ScanSource[]; // 扫描源配置信息
  private _analysisTarget: string[]; // 要分析的目标依赖配置
  private _blackList: string[]; // 需要标记的黑名单API配置
  private _browserApis: string[]; // 需要分析的BrowserApi配置
  private _isScanVue: boolean; // 是否扫描Vue配置
  private _analysisPlugins: AnalysisPluginCreator[]; // 代码分析插件配置
  private _language: Language; // 语言设置

  // 公共属性
  public pluginsQueue: AnalysisPlugin[] = []; // Target分析插件队列
  public browserQueue: AnalysisPlugin[] = []; // Browser分析插件队列
  public importItemMap: Record<
    string,
    Record<
      string,
      {
        callOrigin?: string | null;
        callFiles: string[];
      }
    >
  > = {}; // importItem统计Map
  public importFrom: Record<string, any> = {}; // 依赖统计
  public dependenciesWarn: Record<string, any> = {}; // 可能未安装的依赖
  public diagnosisInfo: DiagnosisInfo[] = [];
  public versionMap: Record<string, Record<string, any>> = {};

  // 插件动态创建的属性
  public apiMap: Record<string, Record<string, any>> = {}; // API分析统计结果
  public methodMap: Record<string, Record<string, any>> = {}; // 方法调用统计结果
  public typeMap: Record<string, Record<string, any>> = {}; // 类型使用统计结果
  public browserMap?: Record<string, Record<string, any>>; // 浏览器API使用统计结果

  constructor(options: DepsAnalysisOptions, language: Language) {
    // 私有属性
    this._scanSource = options.scanSource;
    this._analysisTarget = options.analysisTarget;
    this._blackList = options.blackList || [];
    this._browserApis = options.browserApis || [];
    this._isScanVue = options.isScanVue || false;
    this._analysisPlugins = options.analysisPlugins || [];
    this._language = language;
    // 公共属性
    this.pluginsQueue = [];
    this.browserQueue = [];
    this.importItemMap = {};
    this.importFrom = {};
    this.dependenciesWarn = {};
  }
  async analysis() {
    this._installPlugins(this._analysisPlugins);
    if (this._isScanVue) {
      await this._scanCode(this._scanSource, CODEFILETYPE.VUE);
    }
    await this._scanCode(this._scanSource, CODEFILETYPE.TS);
    this._blackTag(this.pluginsQueue);
    this._blackTag(this.browserQueue);
    this._targetVersionCollect(this._scanSource);
    return this;
  }
  // 目标依赖安装版本收集
  _targetVersionCollect(scanSource: ScanSource[]) {
    const texts = getLocalization(this._language).depsAnalysis;
    scanSource.forEach((item) => {
      if (item.packageJsonPath && item.packageJsonPath != '') {
        try {
          const lockInfo = parsePackageJson(item.packageJsonPath);
          const temp = Object.keys(lockInfo.dependencies).concat(Object.keys(lockInfo.devDependencies));
          if (temp.length > 0) {
            temp.forEach((element) => {
              if (!this.versionMap[item.name]) {
                this.versionMap[item.name] = {};
              }
              this.versionMap[item.name][element] = lockInfo.dependencies[element];
            });
          }
        } catch (e) {
          process.stderr.write(`\r❌ ${texts.versionError(e instanceof Error ? e.message : String(e))}\n`);
        }
      }
    });
  }
  addDiagnosisInfo(info: DiagnosisInfo): void {
    this.diagnosisInfo.push(info);
  }
  // API黑名单标记
  _blackTag(queue: AnalysisPlugin[]): void {
    if (queue.length > 0) {
      queue.forEach((item) => {
        const mapName = item.mapName;
        Object.keys(this[mapName]).forEach((depName) => {
          Object.keys(this[mapName][depName]).forEach((apiName) => {
            let trueApiName = apiName;
            const originInfo = this[mapName][depName][apiName];
            if (originInfo.callOrigin) {
              // 只有在存在callOrigin时才进行处理
              const [firstPart, ...restParts] = apiName.split('.');
              // 使用callOrigin替换第一部分，保持其余部分不变
              trueApiName = [originInfo.callOrigin, ...restParts].join('.');
            }
            if (this._blackList.length > 0 && this._blackList.includes(trueApiName)) {
              // 标记黑名单
              this[mapName][depName][apiName].isBlack = true;
            }
          });
        });
      });
    }
  }
  // 扫描代码
  async _scanCode(scanSource: ScanSource[], type: string): Promise<void> {
    const texts = getLocalization(this._language).depsAnalysis;
    const entrys = await this._scanFiles(scanSource, type);
    // console.log(entrys);
    for (const item of entrys) {
      const tsConfig = parseTsConfig(item.tsConfigPath);
      const parseFiles = item.parse;
      if (parseFiles.length > 0) {
        for (let eIndex = 0; eIndex < parseFiles.length; eIndex++) {
          const element = parseFiles[eIndex];
          const showPath = item.name + '&' + item.show[eIndex];
          try {
            if (type === CODEFILETYPE.VUE) {
              const { ast, checker, baseLine } = parseVue(element, {
                target: ts.ScriptTarget.Latest,
                module: ts.ModuleKind.ESNext,
              }); // 解析vue文件中的ts script片段,将其转化为AST
              if (ast && checker) {
                const importItems = this._findImportItems(
                  ast,
                  showPath,
                  tsConfig?.config?.compilerOptions?.paths,
                  baseLine
                ); // 从import语句中获取导入的需要分析的目标API
                if (Object.keys(importItems).length > 0 || this._browserApis.length > 0) {
                  this._dealAST(importItems, ast, checker, showPath, item.name, item.httpRepo, baseLine); // 递归分析AST，统计相关信息
                }
              }
            } else if (type === CODEFILETYPE.TS) {
              const { ast, checker } = parseTs(element, {
                target: ts.ScriptTarget.Latest,
                module: ts.ModuleKind.ESNext,
              }); // 解析ts文件代码,将其转化为AST
              if (ast && checker) {
                const importItems = this._findImportItems(ast, showPath, tsConfig?.config?.compilerOptions?.paths); // 从import语句中获取导入的需要分析的目标API
                // console.log(importItems);
                if (Object.keys(importItems).length > 0 || this._browserApis.length > 0) {
                  this._dealAST(importItems, ast, checker, showPath, item.name, item.httpRepo); // 递归分析AST，统计相关信息
                }
              }
            }
          } catch (e: unknown) {
            const info: DiagnosisInfo = {
              projectName: item.name,
              httpRepo: (item.httpRepo || '') + item.show[eIndex],
              file: item.show[eIndex],
              depName: '',
              apiName: '',
              matchImportItem: null,
              line: 0,
              stack: e instanceof Error ? e.stack || '' : String(e),
            };
            this.addDiagnosisInfo(info);
          }
          // 使用国际化文本显示进度
          process.stdout.write(`\r${texts.analysisProgress(item.name, type, eIndex + 1, parseFiles.length)}`);

          // 在分析完成时添加换行
          if (eIndex + 1 === parseFiles.length) {
            process.stdout.write('\n');
          }
        }
      }
    }
  }
  // 扫描文件
  async _scanFiles(scanSource: ScanSource[], type: string): Promise<EntryObject[]> {
    const entrys: EntryObject[] = [];

    for (const item of scanSource) {
      const tsConfigPath = path.join(process.cwd(), item.tsConfigPath);
      const entryObj: EntryObject = {
        name: item.name,
        httpRepo: item.httpRepo,
        parse: [],
        show: [],
        tsConfigPath,
      };

      const includePaths = item.include;
      const excludePaths = item.exclude || [];

      for (const sitem of includePaths) {
        // 根据文件类型进行扫描
        let tempEntry: string[] = [];

        if (type === CODEFILETYPE.VUE) {
          // 异步获取Vue文件列表
          tempEntry = await scanFileVue(sitem, excludePaths);
        } else if (type === CODEFILETYPE.TS) {
          // 异步获取TS文件列表
          tempEntry = await scanFileTs(sitem, excludePaths);
        }

        // 格式化路径
        const tempPath = tempEntry.map((titem) => {
          if (item.format && typeof item.format === 'function') {
            return item.format(titem.substring(titem.indexOf(sitem)));
          } else {
            return titem.substring(titem.indexOf(sitem));
          }
        });

        // 合并结果
        entryObj.parse = entryObj.parse.concat(tempEntry);
        entryObj.show = entryObj.show.concat(tempPath);
      }

      entrys.push(entryObj);
    }

    return entrys;
  }
  _installPlugins(plugins: AnalysisPluginCreator[]): void {
    if (plugins.length > 0) {
      for (const plugin of plugins) {
        this.pluginsQueue.push(plugin(this));
      }
    }
    this.pluginsQueue.push(methodPlugin(this));
    this.pluginsQueue.push(typePlugin(this));
    this.pluginsQueue.push(defaultPlugin(this));
    if (this._browserApis.length > 0) {
      this.browserQueue.push(browserPlugin(this));
    }
  }
  // 执行Target分析插件队列中的checkFun函数
  _runAnalysisPlugins(
    tsCompiler: typeof ts,
    baseNode: ts.Node,
    depth: number,
    depName: string,
    apiName: string,
    matchImportItem: {
      origin: string | null;
      [key: string]: any;
    },
    filePath: string,
    projectName: string,
    httpRepo?: string,
    line: number = 0
  ): void {
    if (this.pluginsQueue.length > 0) {
      for (let i = 0; i < this.pluginsQueue.length; i++) {
        const checkFn = this.pluginsQueue[i].checkFn;
        if (
          checkFn(
            this,
            tsCompiler,
            baseNode,
            depth,
            depName,
            apiName,
            matchImportItem,
            filePath,
            projectName,
            httpRepo || '',
            line
          )
        ) {
          break;
        }
      }
    }
  }
  // 执行Target分析插件队列中的afterHook函数
  _runAnalysisPluginsHook(
    importItems: Record<string, ImportItemsMap>,
    ast: ts.SourceFile,
    checker: ts.TypeChecker,
    filePath: string,
    projectName: string,
    httpRepo?: string,
    baseLine: number = 0
  ): void {
    if (this.pluginsQueue.length > 0) {
      for (let i = 0; i < this.pluginsQueue.length; i++) {
        const afterHook = this.pluginsQueue[i].afterHook;
        if (afterHook && typeof afterHook === 'function') {
          afterHook(
            this,
            this.pluginsQueue[i].mapName,
            importItems,
            ast,
            checker,
            filePath,
            projectName,
            httpRepo || '',
            baseLine
          );
        }
      }
    }
  }
  // 执行Browser分析插件队列中的检测函数
  _runBrowserPlugins(
    tsCompiler: typeof ts,
    baseNode: ts.Node,
    depth: number,
    apiName: string,
    filePath: string,
    projectName: string,
    httpRepo?: string,
    line: number = 0
  ): void {
    if (this.browserQueue.length > 0) {
      for (let i = 0; i < this.browserQueue.length; i++) {
        const checkFn = this.browserQueue[i].checkFn;
        if (
          checkFn(
            this,
            tsCompiler,
            baseNode,
            depth,
            'browser',
            apiName,
            { origin: null },
            filePath,
            projectName,
            httpRepo || '',
            line
          )
        ) {
          break;
        }
      }
    }
  }
  // 链式调用检查，找出链路顶点node
  _checkPropertyAccess(node: ts.Node, index: number = 0, apiName: string = ''): PropertyAccessResult {
    // 处理属性访问链
    if (index > 0) {
      // 非首个节点时，获取name.text
      if (ts.isPropertyAccessExpression(node) && node.name) {
        apiName = apiName + '.' + node.name.text;
      }
    } else {
      // 首个节点时，处理标识符
      if (ts.isIdentifier(node)) {
        apiName = apiName + node.text;
      }
    }

    // 递归检查父节点是否为属性访问表达式
    if (node.parent && ts.isPropertyAccessExpression(node.parent)) {
      index++;
      return this._checkPropertyAccess(node.parent, index, apiName);
    } else {
      // 返回链路顶点信息
      return {
        baseNode: node,
        depth: index,
        apiName: apiName,
      };
    }
  }

  // AST分析
  _dealAST(
    importItems: Record<string, ImportItemsMap>,
    ast: ts.SourceFile,
    checker: ts.TypeChecker,
    filePath: string,
    projectName: string,
    httpRepo?: string,
    baseLine: number = 0
  ): void {
    const that = this;

    // 遍历AST
    function walk(node: ts.Node): void {
      ts.forEachChild(node, walk);
      const line = ast.getLineAndCharacterOfPosition(node.getStart()).line + baseLine + 1;

      // target analysis
      if (ts.isIdentifier(node) && node.text) {
        // 命中Target Api Item Name

        const depName = Object.keys(importItems).find((key) => Object.keys(importItems[key]).includes(node.text)) || '';

        if (depName) {
          const matchImportItem = importItems[depName][node.text];

          if (node.pos !== matchImportItem.identifierPos && node.end !== matchImportItem.identifierEnd) {
            // 排除importItem Node自身

            const symbol = checker.getSymbolAtLocation(node);

            if (symbol && symbol.declarations && symbol.declarations.length > 0) {
              // 存在上下文声明
              const nodeSymbol = symbol.declarations[0];

              if (matchImportItem.symbolPos === nodeSymbol.pos && matchImportItem.symbolEnd === nodeSymbol.end) {
                // 上下文声明与import item匹配, 符合API调用
                if (node.parent) {
                  const { baseNode, depth, apiName } = that._checkPropertyAccess(node);
                  that._runAnalysisPlugins(
                    ts,
                    baseNode,
                    depth,
                    depName,
                    apiName,
                    matchImportItem,
                    filePath,
                    projectName,
                    httpRepo,
                    line
                  );
                } else {
                  // Identifier节点如果没有parent属性，说明AST节点语义异常，不存在分析意义
                }
              } else {
                // 上下文非importItem API但与其同名的Identifier节点
              }
            }
          }
        }
      }
      // browser analysis
      if (ts.isIdentifier(node) && node.text && that._browserApis.length > 0 && that._browserApis.includes(node.text)) {
        // 命中Browser Api Item Name
        const symbol = checker.getSymbolAtLocation(node);
        if (symbol && symbol.declarations) {
          if (
            symbol.declarations.length > 1 ||
            (symbol.declarations.length == 1 && symbol.declarations[0].pos > ast.end)
          ) {
            // 在AST中找不到上下文声明，证明是Bom,Dom对象
            const { baseNode, depth, apiName } = that._checkPropertyAccess(node);

            const propertyAccess = node.parent as ts.PropertyAccessExpression;
            if (
              !(
                depth > 0 &&
                propertyAccess.name &&
                propertyAccess.name.pos === node.pos &&
                propertyAccess.name.end === node.end
              )
            ) {
              that._runBrowserPlugins(ts, baseNode, depth, apiName, filePath, projectName, httpRepo, line);
            }
          }
        }
      }
    }

    walk(ast);

    // 执行afterHook函数
    this._runAnalysisPluginsHook(importItems, ast, checker, filePath, projectName, httpRepo, baseLine);
  }

  // 分析import引入
  _findImportItems(
    ast: ts.SourceFile,
    filePath: string,
    paths: any,
    baseLine: number = 0
  ): Record<string, ImportItemsMap> {
    const importItems: Record<string, ImportItemsMap> = {};
    const that = this;

    // 模块类型常量
    const ModuleType = {
      LOCAL_FILE: 'LOCAL_FILE', // 本地文件导入
      NODE_PACKAGE: 'NODE_PACKAGE', // Node包导入
      UNKNOWN: 'UNKNOWN', // 未知类型
    } as const;

    type ModuleTypeValue = (typeof ModuleType)[keyof typeof ModuleType];

    // 使用正则表达式模式判断模块类型
    function determineModuleType(modulePath: string): ModuleTypeValue {
      // 特殊情况：空路径
      if (!modulePath || modulePath.length === 0) {
        return ModuleType.UNKNOWN;
      }

      // 处理已经解析的本地路径别名
      if (paths) {
        const commonLocalPrefixes = ['src/', 'app/', 'libs/', 'packages/'];
        for (const prefix of commonLocalPrefixes) {
          if (modulePath.startsWith(prefix)) {
            return ModuleType.LOCAL_FILE;
          }
        }
      }

      // 使用正则模式匹配不同类型的路径

      // 1. 相对路径 (./ 或 ../ 开头)
      if (/^\.\.?\//.test(modulePath)) {
        return ModuleType.LOCAL_FILE;
      }

      // 2. 绝对路径 (以 / 开头)
      if (/^\//.test(modulePath)) {
        return ModuleType.LOCAL_FILE;
      }

      // 3. 作用域包 (以 @ 开头，格式为 @scope/package)
      const scopedPackageMatch = modulePath.match(/^@([^/]+)\/([^/]+)/);
      if (scopedPackageMatch) {
        const packageName = scopedPackageMatch[0]; // 完整的包名 (@scope/package)

        // 检查分析目标
        if (that._analysisTarget.length > 0) {
          return that._analysisTarget.includes(packageName) ? ModuleType.NODE_PACKAGE : ModuleType.UNKNOWN;
        }
        return ModuleType.NODE_PACKAGE;
      }

      // 4. 普通包 (不含 / 的顶层包名)
      const normalPackageMatch = modulePath.match(/^([^/]+)(?:\/|$)/);
      if (normalPackageMatch) {
        const packageName = normalPackageMatch[1]; // 包名

        // 检查分析目标
        if (that._analysisTarget.length > 0) {
          return that._analysisTarget.includes(packageName) ? ModuleType.NODE_PACKAGE : ModuleType.UNKNOWN;
        }
        return ModuleType.NODE_PACKAGE;
      }

      // 无法确定类型
      return ModuleType.UNKNOWN;
    }

    // 解析模块路径，处理别名
    function resolveModulePath(modulePath: string): string {
      // 如果没有提供paths配置，直接返回原始路径
      if (!paths) return modulePath;

      // 遍历paths配置中的所有别名
      for (const alias in paths) {
        // 替换别名中的通配符，比如将 "@/*" 转换为正则 "^@\/(.*)$"
        const aliasPattern = alias.replace(/\*/g, '(.*)');
        const aliasRegex = new RegExp(`^${aliasPattern.replace(/\//g, '\\/')}$`);

        // 检查模块路径是否匹配当前别名
        const matches = modulePath.match(aliasRegex);
        if (matches) {
          // 获取通配符捕获的部分
          const wildcardPart = matches[1] || '';

          // 获取别名对应的真实路径模板
          const realPathTemplates = paths[alias];

          // 使用第一个路径模板替换别名
          if (realPathTemplates && realPathTemplates.length > 0) {
            // 将路径模板中的通配符替换为捕获的部分
            let realPath = realPathTemplates[0].replace(/\*/g, wildcardPart);

            // 移除路径末尾的index (如果有)
            if (realPath.endsWith('/index')) {
              realPath = realPath.substring(0, realPath.length - 6);
            }

            return realPath;
          }
        }
      }

      // 如果没有匹配的别名，返回原始路径
      return modulePath;
    }

    // 遍历AST寻找import节点
    function walk(node: ts.Node): void {
      ts.forEachChild(node, walk);
      const line = ast.getLineAndCharacterOfPosition(node.getStart()).line + baseLine + 1;

      // 分析引入情况
      if (ts.isImportDeclaration(node)) {
        function checkModuleSpecifier(text: string) {
          if (that._analysisTarget.length > 0) {
            return that._analysisTarget.includes(text);
          }
          return true;
        }
        // 检查模块说明符
        if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
          // 获取并解析模块路径
          const rawModulePath = node.moduleSpecifier.text;
          const resolvedModulePath = resolveModulePath(rawModulePath);

          // 判断模块类型，过滤本地文件导入
          const moduleType = determineModuleType(resolvedModulePath);
          if (moduleType === ModuleType.LOCAL_FILE) {
            return; // 跳过本地文件导入
          }

          // 只有通过检查的模块才处理
          if (checkModuleSpecifier(resolvedModulePath)) {
            // 存在导入项
            if (node.importClause) {
              // default直接引入场景
              if (node.importClause.name) {
                const temp: ImportItem = {
                  depName: resolvedModulePath, // 使用解析后的路径
                  name: node.importClause.name.text,
                  origin: null,
                  symbolPos: node.importClause.pos,
                  symbolEnd: node.importClause.end,
                  identifierPos: node.importClause.name.pos,
                  identifierEnd: node.importClause.name.end,
                  line: line,
                };
                dealImports(temp);
              }

              // 处理命名导入和命名空间导入
              if (node.importClause.namedBindings) {
                // 拓展引入场景，包含as情况
                if (ts.isNamedImports(node.importClause.namedBindings)) {
                  if (node.importClause.namedBindings.elements && node.importClause.namedBindings.elements.length > 0) {
                    const tempArr = node.importClause.namedBindings.elements;

                    for (const element of tempArr) {
                      if (ts.isImportSpecifier(element)) {
                        const temp: ImportItem = {
                          depName: resolvedModulePath, // 使用解析后的路径
                          name: element.name.text,
                          origin: element.propertyName ? element.propertyName.text : null,
                          symbolPos: element.pos,
                          symbolEnd: element.end,
                          identifierPos: element.name.pos,
                          identifierEnd: element.name.end,
                          line: line,
                        };
                        dealImports(temp);
                      }
                    }
                  }
                }

                // * 全量导入as场景
                if (ts.isNamespaceImport(node.importClause.namedBindings) && node.importClause.namedBindings.name) {
                  const temp: ImportItem = {
                    depName: resolvedModulePath, // 使用解析后的路径
                    name: node.importClause.namedBindings.name.text,
                    origin: '*',
                    symbolPos: node.importClause.namedBindings.pos,
                    symbolEnd: node.importClause.namedBindings.end,
                    identifierPos: node.importClause.namedBindings.name.pos,
                    identifierEnd: node.importClause.namedBindings.name.end,
                    line: line,
                  };
                  dealImports(temp);
                }
              }
            }
          }
        }
      }
    }

    // 处理imports相关map
    function dealImports(temp: ImportItem): void {
      // 确保依赖名称的对象已经初始化
      if (!importItems[temp.depName]) {
        importItems[temp.depName] = {};
      }

      // 确保importItemMap中的依赖名称已初始化
      if (!that.importItemMap[temp.depName]) {
        that.importItemMap[temp.depName] = {};
      }

      importItems[temp.depName][temp.name] = {
        origin: temp.origin,
        symbolPos: temp.symbolPos,
        symbolEnd: temp.symbolEnd,
        identifierPos: temp.identifierPos,
        identifierEnd: temp.identifierEnd,
      };

      if (!that.importItemMap[temp.depName][temp.name]) {
        that.importItemMap[temp.depName][temp.name] = {
          callOrigin: temp.origin,
          callFiles: [filePath],
        };
      } else {
        // 避免重复添加相同的文件路径
        if (!that.importItemMap[temp.depName][temp.name].callFiles.includes(filePath)) {
          that.importItemMap[temp.depName][temp.name].callFiles.push(filePath);
        }
      }
    }

    walk(ast);
    return importItems;
  }
}

export default DepsAnalysis;
