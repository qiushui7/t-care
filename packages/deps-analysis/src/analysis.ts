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
import { CODEFILETYPE, ModuleType } from './constant';
import { resolveModulePath } from './moduleResolver';
import { ScanSource, AnalysisPlugin, AnalysisPluginCreator, DepsAnalysisOptions, DiagnosisInfo } from './types';
import { methodPlugin } from './plugins/methodPlugin';
import { typePlugin } from './plugins/typePlugin';
import { defaultPlugin } from './plugins/defaultPlugin';
import { globalPlugin } from './plugins/GlobalPlugin';
import path from 'path';
import { builtinModules } from 'module';
import { AnalysisCache, CacheManager, FileHash } from './cacheManager';
import { deepMerge } from './utils';
import fs from 'fs';
// EntryObject接口定义
interface EntryObject {
  name: string;
  httpRepo?: string;
  parse: string[];
  show: string[];
  tsConfigPath: string;
  type: string;
}

type ModuleTypeValue = (typeof ModuleType)[keyof typeof ModuleType];

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
  projectName: string;
  moduleType: ModuleTypeValue;
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
  private _analysisTarget: string[]; // 要分析的目标依赖配置
  private _blackList: string[]; // 需要标记的黑名单API配置
  private _globalApis: string[]; // 需要分析的GlobalApi配置
  private _isScanVue: boolean; // 是否扫描Vue配置
  private _analysisPlugins: AnalysisPluginCreator[]; // 代码分析插件配置
  private _language: Language; // 语言设置
  private _cacheManager: CacheManager; // 缓存管理器
  private _cacheDir: string; // 缓存路径
  private _changedFiles: Set<string> = new Set(); // 变更的文件

  // 公共属性
  public incremental: boolean; // 是否增量分析
  private scanSource: ScanSource[]; // 扫描源配置信息
  public pluginsQueue: AnalysisPlugin[] = []; // Target分析插件队列
  public globalQueue: AnalysisPlugin[] = []; // Global分析插件队列
  public importItemMap: Record<
    string,
    Record<
      string,
      | {
          callOrigin?: string | null;
          callFiles: string[];
        }
      | ModuleTypeValue
    >
  > = {}; // importItem统计Map
  public ghostDependenciesWarn: Record<string, any> = {}; // 可能的幽灵依赖依赖
  public diagnosisInfo: DiagnosisInfo[] = [];
  public versionMap: Record<string, Record<string, any>> = {};
  public fileCache: Record<string, any> = {}; // 文件缓存
  public scanEntrys: EntryObject[] = [];

  // 插件动态创建的属性
  public apiMap: Record<string, Record<string, any>> = {}; // API分析统计结果
  public methodMap: Record<string, Record<string, any>> = {}; // 方法调用统计结果
  public typeMap: Record<string, Record<string, any>> = {}; // 类型使用统计结果
  public globalMap: Record<string, Record<string, any>> = {}; // 全局API使用统计结果

  constructor(options: DepsAnalysisOptions, language: Language) {
    // 私有属性
    this._analysisTarget = options.analysisTarget;
    this._blackList = options.blackList || [];
    this._globalApis = options.globalApis || [];
    this._isScanVue = options.isScanVue || false;
    this._analysisPlugins = options.analysisPlugins || [];
    this._cacheDir = options.cacheDir || '';
    this._cacheManager = new CacheManager(this._cacheDir);
    this._language = language;
    // 公共属性
    this.scanSource = options.scanSource;
    this.incremental = options.incremental || false;
    this.pluginsQueue = [];
    this.globalQueue = [];
    this.importItemMap = {};
    this.ghostDependenciesWarn = {};
  }
  async analysis() {
    this._installPlugins(this._analysisPlugins);
    this._targetVersionCollect(this.scanSource);

    this.scanEntrys = await this._scanFiles(this.scanSource, CODEFILETYPE.TS);
    if (this._isScanVue) {
      this.scanEntrys.push(...(await this._scanFiles(this.scanSource, CODEFILETYPE.VUE)));
    }
    if (this.incremental) {
      await this._loadAnalysisCache();
    }
    await this._scanCode();
    this._blackTag(this.pluginsQueue);
    this._blackTag(this.globalQueue);

    if (this.incremental) {
      await this._saveAnalysisCache();
    }
    return this;
  }
  // 加载分析缓存
  async _loadAnalysisCache() {
    const texts = getLocalization(this._language).depsAnalysis;
    const cache = this._cacheManager.loadCache();
    if (cache) {
      // 记录已更改的文件
      await this._identifyChangedFiles(cache.fileHashes || []);

      if (cache.fileCache) {
        this.fileCache = cache.fileCache;
        // 创建一个新的空对象，用于存储未更改文件的缓存数据
        let mergedImportItemMap = {};
        let mergedApiMap = {};
        let mergedMethodMap = {};
        let mergedTypeMap = {};
        let mergedGlobalMap = {};
        let mergedGhostDependenciesWarn = {};
        let eIndex = 0;
        // 只合并未更改文件的缓存数据
        Object.entries(cache.fileCache).forEach(([filePath, fileCache]) => {
          if (this._changedFiles.has(filePath)) {
            return;
          }
          // 使用深度合并方法合并各种映射
          mergedImportItemMap = deepMerge(mergedImportItemMap, fileCache.importItemMap || {});
          mergedApiMap = deepMerge(mergedApiMap, fileCache.apiMap || {});
          mergedMethodMap = deepMerge(mergedMethodMap, fileCache.methodMap || {});
          mergedTypeMap = deepMerge(mergedTypeMap, fileCache.typeMap || {});
          mergedGlobalMap = deepMerge(mergedGlobalMap, fileCache.globalMap || {});
          mergedGhostDependenciesWarn = deepMerge(mergedGhostDependenciesWarn, fileCache.ghostDependenciesWarn || {});
          eIndex++;
        });

        // 设置合并后的结果
        this.importItemMap = mergedImportItemMap;
        this.apiMap = mergedApiMap;
        this.methodMap = mergedMethodMap;
        this.typeMap = mergedTypeMap;
        this.globalMap = mergedGlobalMap;
        this.ghostDependenciesWarn = mergedGhostDependenciesWarn;
        console.log('\r', texts.cacheLoaded(eIndex));
      }
    }
  }
  // 保存分析缓存
  async _saveAnalysisCache() {
    const fileHashes: FileHash[] = [];
    for (const item of this.scanEntrys) {
      for (const file of item.parse) {
        const hash = this._cacheManager.calculateFileHash(file);
        fileHashes.push(hash);
      }
    }

    const cache: AnalysisCache = {
      version: '1.0.0',
      timestamp: Date.now(),
      fileHashes,
      fileCache: this.fileCache,
    };

    this._cacheManager.saveCache(cache);
  }
  // 记录已更改的文件
  async _identifyChangedFiles(cachedHashes: FileHash[]) {
    this._changedFiles.clear();

    for (const item of this.scanEntrys) {
      for (const file of item.parse) {
        if (this._cacheManager.hasFileChanged(file, cachedHashes)) {
          this._changedFiles.add(file);
        }
      }
    }
  }

  // 目标依赖安装版本收集
  _targetVersionCollect(scanSource: ScanSource[]) {
    const texts = getLocalization(this._language).depsAnalysis;
    for (const item of scanSource) {
      if (item.packageJsonPath && item.packageJsonPath != '') {
        try {
          const lockInfo = parsePackageJson(item.packageJsonPath);
          const temp = Object.keys(lockInfo?.dependencies || {}).concat(Object.keys(lockInfo?.devDependencies || {}));
          if (temp.length > 0) {
            temp.forEach((element) => {
              if (!this.versionMap[item.name]) {
                this.versionMap[item.name] = {};
              }
              this.versionMap[item.name][element] =
                lockInfo?.dependencies[element] || lockInfo?.devDependencies[element];
            });
          }
        } catch (e) {
          process.stderr.write(`\r❌ ${texts.versionError(e instanceof Error ? e.message : String(e))}\n`);
        }
      }
    }
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
  async _scanCode(): Promise<void> {
    const texts = getLocalization(this._language).depsAnalysis;
    for (const item of this.scanEntrys) {
      const tsConfig = parseTsConfig(item.tsConfigPath);
      if (tsConfig?.options?.baseUrl) {
        // 获取tsconfig.json所在的目录
        const tsConfigDir = path.dirname(item.tsConfigPath);
        // 将baseUrl解析为基于tsconfig目录的路径，但保持为相对路径
        const absoluteBaseUrl = path.resolve(tsConfigDir, tsConfig.options.baseUrl);
        // 转换为相对于当前执行目录的相对路径
        tsConfig.options.baseUrl = path.relative(process.cwd(), absoluteBaseUrl);
      }
      const parseFiles = item.parse;
      const type = item.type;
      if (parseFiles.length > 0) {
        for (let eIndex = 0; eIndex < parseFiles.length; eIndex++) {
          const element = parseFiles[eIndex];
          const showPath = item.name + '&' + item.show[eIndex];
          if (this.incremental && this._cacheManager.hasCache && !this._changedFiles.has(element)) {
            continue;
          }
          if (this.incremental && !this.fileCache[element]) {
            this.fileCache[element] = {
              importItemMap: {},
              apiMap: {},
              methodMap: {},
              typeMap: {},
              globalMap: {},
              ghostDependenciesWarn: {},
            };
          }
          try {
            if (type === CODEFILETYPE.VUE) {
              const { ast, checker, baseLine } = parseVue(element, tsConfig?.options); // 解析vue文件中的ts script片段,将其转化为AST
              if (ast && checker) {
                const importItems = this._findImportItems(
                  ast,
                  showPath,
                  tsConfig?.options,
                  element,
                  item.name,
                  baseLine
                ); // 从import语句中获取导入的需要分析的目标API
                if (Object.keys(importItems).length > 0 || this._globalApis.length > 0) {
                  this._dealAST(importItems, ast, checker, showPath, element, item.name, item.httpRepo, baseLine); // 递归分析AST，统计相关信息
                }
              }
            } else if (type === CODEFILETYPE.TS) {
              const { ast, checker } = parseTs(element, tsConfig?.options); // 解析ts文件代码,将其转化为AST
              if (ast && checker) {
                const importItems = this._findImportItems(ast, showPath, tsConfig?.options, element, item.name); // 从import语句中获取导入的需要分析的目标API
                if (Object.keys(importItems).length > 0 || this._globalApis.length > 0) {
                  this._dealAST(importItems, ast, checker, showPath, element, item.name, item.httpRepo); // 递归分析AST，统计相关信息
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
            console.log(info);
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
        type: type,
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
    this.globalQueue.push(globalPlugin(this));
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
    absolutePath: string,
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
            line,
            absolutePath
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
  // 执行Global分析插件队列中的检测函数
  _runGlobalPlugins(
    tsCompiler: typeof ts,
    baseNode: ts.Node,
    depth: number,
    apiName: string,
    filePath: string,
    absolutePath: string,
    projectName: string,
    httpRepo?: string,
    line: number = 0
  ): void {
    if (this.globalQueue.length > 0) {
      for (let i = 0; i < this.globalQueue.length; i++) {
        const checkFn = this.globalQueue[i].checkFn;
        if (
          checkFn(
            this,
            tsCompiler,
            baseNode,
            depth,
            'global',
            apiName,
            { origin: null },
            filePath,
            projectName,
            httpRepo || '',
            line,
            absolutePath
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
    absolutePath: string,
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
                    absolutePath,
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
      // global analysis
      function checkGlobalApi(text: string) {
        if (that._globalApis.length > 0) {
          return that._globalApis.includes(text);
        }
        return true;
      }
      if (ts.isIdentifier(node) && node.text && checkGlobalApi(node.text)) {
        // 命中Global Api Item Name
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
              that._runGlobalPlugins(ts, baseNode, depth, apiName, filePath, absolutePath, projectName, httpRepo, line);
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
    tsCompilerOptions: ts.CompilerOptions,
    absolutePath: string,
    projectName: string,
    baseLine: number = 0
  ): Record<string, ImportItemsMap> {
    const importItems: Record<string, ImportItemsMap> = {};
    const that = this;
    // 模块类型常量
    function resolveDepName(absolutePath: string | null): string {
      if (absolutePath === null) {
        return '';
      }

      // 处理pnpm格式路径
      // 例如: /node_modules/.pnpm/@nestjs+core@10.4.15_xxx/node_modules/@nestjs/core/
      const pnpmMatch = absolutePath.match(
        /node_modules\/\.pnpm\/([^/]+)(?:@[^/]+)(?:_[^/]+)?\/node_modules\/(@[^/]+\/[^/]+|[^/]+)/
      );
      if (pnpmMatch) {
        return pnpmMatch[2]; // 返回真实包名（如@nestjs/core）
      }

      // 处理常规npm/yarn路径格式
      // 例如: /node_modules/@nestjs/core/ 或 /node_modules/react/
      const nodeModulesMatch = absolutePath.match(/node_modules[/\\](@[^/\\]+[/\\][^/\\]+|[^/\\]+)/);
      if (nodeModulesMatch && nodeModulesMatch[1]) {
        return nodeModulesMatch[1];
      }

      return absolutePath;
    }

    // 将依赖添加到幽灵依赖警告列表中
    function dealGhostDependencies(projectName: string, depName: string, warnObject: Record<string, any>) {
      // 确保项目在幽灵依赖警告映射中有一个数组
      if (!warnObject[projectName]) {
        warnObject[projectName] = [];
      }

      // 避免重复添加同一个依赖
      if (!warnObject[projectName].includes(depName)) {
        warnObject[projectName].push(depName);
      }
    }

    // 检查幽灵依赖（在代码中使用但未在package.json中声明的依赖）
    function checkGhostDependencies(
      projectName: string,
      depName: string,
      actualPath: string | null,
      moduleType: ModuleTypeValue
    ) {
      if (moduleType === ModuleType.NODE_MODULE) return;
      // 对未知模块类型直接添加警告
      if (moduleType === ModuleType.UNKNOWN) {
        dealGhostDependencies(projectName, depName, that.ghostDependenciesWarn);
        if (that.incremental) {
          dealGhostDependencies(projectName, depName, that.fileCache[absolutePath].ghostDependenciesWarn);
        }
        return;
      }

      // 解析实际的依赖包名
      const resolvedDepName = resolveDepName(actualPath);

      // 检查项目的package.json中是否包含该依赖
      const hasDependency = that.versionMap[projectName] && that.versionMap[projectName][resolvedDepName];
      if (!hasDependency) {
        dealGhostDependencies(projectName, resolvedDepName, that.ghostDependenciesWarn);
        if (that.incremental) {
          dealGhostDependencies(projectName, resolvedDepName, that.fileCache[absolutePath].ghostDependenciesWarn);
        }
      }

      // 对@types包特殊处理
      if (resolvedDepName.startsWith('@types/')) {
        const actualPackageName = resolvedDepName.split('/')[1];
        const hasTypeDependency = that.versionMap[projectName] && that.versionMap[projectName][actualPackageName];
        if (!hasTypeDependency) {
          dealGhostDependencies(projectName, actualPackageName, that.ghostDependenciesWarn);
          if (that.incremental) {
            dealGhostDependencies(projectName, actualPackageName, that.fileCache[absolutePath].ghostDependenciesWarn);
          }
        }
      }
    }

    // 使用正则表达式模式判断模块类型
    function determineModuleType(modulePath: string | null, rawModulePath: string): ModuleTypeValue {
      if (/^\.\.?\//.test(rawModulePath)) return ModuleType.LOCAL_FILE;
      if (modulePath === null && builtinModules.includes(rawModulePath)) return ModuleType.NODE_MODULE;
      if (modulePath === null) return ModuleType.UNKNOWN;
      if (modulePath && modulePath.includes('node_modules')) return ModuleType.NODE_PACKAGE;
      return ModuleType.LOCAL_FILE;
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
          const resolvedModulePath = resolveModulePath(rawModulePath, absolutePath, tsCompilerOptions);

          // 判断模块类型，过滤本地文件导入
          const moduleType = determineModuleType(resolvedModulePath, rawModulePath);
          if (moduleType === ModuleType.LOCAL_FILE) {
            return; // 跳过本地文件导入
          }
          checkGhostDependencies(projectName, rawModulePath, resolvedModulePath, moduleType);
          // 只有通过检查的模块才处理
          if (checkModuleSpecifier(rawModulePath)) {
            // 存在导入项
            if (node.importClause) {
              // default直接引入场景
              if (node.importClause.name) {
                const temp: ImportItem = {
                  depName: rawModulePath,
                  name: node.importClause.name.text,
                  origin: null,
                  symbolPos: node.importClause.pos,
                  symbolEnd: node.importClause.end,
                  identifierPos: node.importClause.name.pos,
                  identifierEnd: node.importClause.name.end,
                  line: line,
                  projectName: projectName,
                  moduleType: moduleType,
                };
                dealImports(temp, that.importItemMap);
                if (that.incremental) {
                  dealImports(temp, that.fileCache[absolutePath].importItemMap);
                }
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
                          depName: rawModulePath,
                          name: element.name.text,
                          origin: element.propertyName ? element.propertyName.text : null,
                          symbolPos: element.pos,
                          symbolEnd: element.end,
                          identifierPos: element.name.pos,
                          identifierEnd: element.name.end,
                          line: line,
                          projectName: projectName,
                          moduleType: moduleType,
                        };
                        dealImports(temp, that.importItemMap);
                        if (that.incremental) {
                          dealImports(temp, that.fileCache[absolutePath].importItemMap);
                        }
                      }
                    }
                  }
                }

                // * 全量导入as场景
                if (ts.isNamespaceImport(node.importClause.namedBindings) && node.importClause.namedBindings.name) {
                  const temp: ImportItem = {
                    depName: rawModulePath, // 使用解析后的路径
                    name: node.importClause.namedBindings.name.text,
                    origin: '*',
                    symbolPos: node.importClause.namedBindings.pos,
                    symbolEnd: node.importClause.namedBindings.end,
                    identifierPos: node.importClause.namedBindings.name.pos,
                    identifierEnd: node.importClause.namedBindings.name.end,
                    line: line,
                    projectName: projectName,
                    moduleType: moduleType,
                  };
                  dealImports(temp, that.importItemMap);
                  if (that.incremental) {
                    dealImports(temp, that.fileCache[absolutePath].importItemMap);
                  }
                }
              }
            }
          }
        }
      }
    }

    // 处理imports相关map
    function dealImports(temp: ImportItem, importItemMap: Record<string, any>): void {
      // 确保依赖名称的对象已经初始化
      if (!importItems[temp.depName]) {
        importItems[temp.depName] = {};
      }
      // 确保importItemMap中的依赖名称已初始化
      if (!importItemMap[temp.depName]) {
        importItemMap[temp.depName] = {};
      }

      importItems[temp.depName][temp.name] = {
        origin: temp.origin,
        symbolPos: temp.symbolPos,
        symbolEnd: temp.symbolEnd,
        identifierPos: temp.identifierPos,
        identifierEnd: temp.identifierEnd,
      };

      if (!importItemMap[temp.depName][temp.projectName]) {
        importItemMap[temp.depName][temp.projectName] = temp.moduleType;
      }

      if (!importItemMap[temp.depName][temp.name]) {
        importItemMap[temp.depName][temp.name] = {
          callOrigin: temp.origin,
          callFiles: [filePath],
        };
      } else {
        // 避免重复添加相同的文件路径
        // 检查是否为ModuleTypeValue类型
        if (typeof importItemMap[temp.depName][temp.name] === 'object') {
          const item = importItemMap[temp.depName][temp.name] as {
            callOrigin?: string | null;
            callFiles: string[];
          };
          if (!item.callFiles.includes(filePath)) {
            item.callFiles.push(filePath);
          }
        }
      }
    }

    walk(ast);
    return importItems;
  }
}

export default DepsAnalysis;
