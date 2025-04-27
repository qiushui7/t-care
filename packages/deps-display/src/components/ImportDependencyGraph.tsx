import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CallFileInfo, DependencyJsonData } from '../types/dependencyTypes';
import { Package, Code, Type, AlertTriangle } from 'lucide-react';

interface ImportDependencyGraphProps {
  data: DependencyJsonData;
  loading: boolean;
  error: string | null;
}

interface ImportItem {
  name: string;
  callOrigin: string | null;
  callCount: number;
  callFiles: Record<string, CallFileInfo>;
  isBlack: boolean;
  type: 'method' | 'type' | 'other'; // 导入项类型
}

interface PackageDependency {
  packageName: string;
  projectVersions: Record<string, string>; // 每个项目中的版本
  allImportItems: ImportItem[];
  // 按类型分类的导入项
  methodItems: ImportItem[];
  typeItems: ImportItem[];
  otherItems: ImportItem[];
}

const ImportDependencyGraph: React.FC<ImportDependencyGraphProps> = ({ data, loading, error }) => {
  const { t } = useTranslation();
  const [dependencies, setDependencies] = useState<PackageDependency[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [selectedImport, setSelectedImport] = useState<ImportItem | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredDependencies, setFilteredDependencies] = useState<PackageDependency[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'method' | 'type' | 'other'>('all');

  useEffect(() => {
    if (data && data.importItemMap) {
      const parsedDeps = parseImportDependencies(data);
      setDependencies(parsedDeps);
      setFilteredDependencies(parsedDeps);

      // 默认选择第一个包
      if (parsedDeps.length > 0 && !selectedPackage) {
        setSelectedPackage(parsedDeps[0].packageName);
      }
    }
  }, [data, selectedPackage]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = dependencies.filter(dep =>
        dep.packageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dep.allImportItems.some(item =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      // 排序结果，含有黑名单API的包排在前面
      setFilteredDependencies(filtered.sort((a, b) => {
        // 如果a有黑名单API，但b没有，a排在前面
        if (a.allImportItems.some(item => item.isBlack) && !b.allImportItems.some(item => item.isBlack)) {
          return -1;
        }
        // 如果b有黑名单API，但a没有，b排在前面
        if (!a.allImportItems.some(item => item.isBlack) && b.allImportItems.some(item => item.isBlack)) {
          return 1;
        }
        // 两者都有黑名单API或都没有黑名单API，按包名称排序
        return a.packageName.localeCompare(b.packageName);
      }));
    } else {
      setFilteredDependencies(dependencies);
    }
  }, [searchTerm, dependencies]);

  // 当选择一个新的包时，重置已选择的导入项
  useEffect(() => {
    setSelectedImport(null);
    setActiveTab('all'); // 重置为显示全部
  }, [selectedPackage]);

  const parseImportDependencies = (data: DependencyJsonData): PackageDependency[] => {
    const { importItemMap, versionMap, methodMap, typeMap, apiMap } = data;
    const result: PackageDependency[] = [];
    // 获取项目名称列表
    const projectNames = data._scanSource ? data._scanSource.map(src => src.name) : [];

    // 处理importItemMap
    Object.entries(importItemMap).forEach(([packageName, importEntries]) => {
      // 跳过NODE_MODULE类型的模块，它们将在Node API视图中显示
      if (typeof importEntries === 'object' && projectNames.some(name => importEntries[name] === 'NODE_MODULE')) {
        return;
      }

      let allImportItems: ImportItem[] = [];
      let methodItems: ImportItem[] = [];
      let typeItems: ImportItem[] = [];
      let otherItems: ImportItem[] = [];
      const allImportKeys: string[] = Object.keys(importEntries);
      methodItems = Object.entries(methodMap?.[packageName] || {}).map(([itemName, item]) => {
        const tempName = itemName.split('.')[0];
        if (allImportKeys.includes(tempName)) {
          allImportKeys.splice(allImportKeys.findIndex(item => item === tempName), 1);
        }
        return {
          name: itemName,
          callOrigin: item.callOrigin,
          callCount: item.callNum,
          callFiles: item.callFiles,
          isBlack: item.isBlack || false,
          type: 'method'
        }
      }) || [];
      typeItems = Object.entries(typeMap?.[packageName] || {}).map(([itemName, item]) => {
        const tempName = itemName.split('.')[0];
        if (allImportKeys.includes(tempName)) {
          allImportKeys.splice(allImportKeys.findIndex(item => item === tempName), 1);
        }
        return {
          name: itemName,
          callOrigin: item.callOrigin,
          callCount: item.callNum,
          callFiles: item.callFiles,
          isBlack: item.isBlack || false,
          type: 'type'
        }
      }) || [];
      otherItems = Object.entries(apiMap?.[packageName] || {}).map(([itemName, item]) => {
        const tempName = itemName.split('.')[0];
        if (allImportKeys.includes(tempName)) {
          allImportKeys.splice(allImportKeys.findIndex(item => item === tempName), 1);
        }
        return {
          name: itemName,
          callOrigin: item.callOrigin,
          callCount: item.callNum,
          callFiles: item.callFiles,
          isBlack: item.isBlack || false,
          type: 'other'
        }
      }) || [];
      allImportItems = [...methodItems, ...typeItems, ...otherItems];

      // 获取每个项目中使用此包的版本信息 - 用于显示多个项目中的不同版本
      const projectVersions: Record<string, string> = {};
      if (versionMap) {
        for (const projectName of projectNames) {
          if (versionMap[projectName] && versionMap[projectName][packageName]) {
            const ver = versionMap[projectName][packageName];
            projectVersions[projectName] = ver;
          }
        }
      }

      result.push({
        packageName,
        projectVersions, // 所有项目中的版本信息
        allImportItems,
        methodItems,
        typeItems,
        otherItems
      });
    });

    // 按包名称排序，含有黑名单API的包排在最上面
    return result.sort((a, b) => {
      // 如果a有黑名单API，但b没有，a排在前面
      if (a.allImportItems.some(item => item.isBlack) && !b.allImportItems.some(item => item.isBlack)) {
        return -1;
      }
      // 如果b有黑名单API，但a没有，b排在前面
      if (!a.allImportItems.some(item => item.isBlack) && b.allImportItems.some(item => item.isBlack)) {
        return 1;
      }
      // 两者都有黑名单API或都没有黑名单API，按包名称排序
      return a.packageName.localeCompare(b.packageName);
    });
  };

  // 从文件路径中提取仓库链接，包含行号引用
  const getRepoLink = (filePath: string): { url: string | null; lineNumbers: number[] } => {
    // 即使没有 scanSource 或 httpRepo，我们也要尝试获取行号信息
    let lineNumbers: number[] = [];

    // 从不同的 Map 中查找行号信息
    if (selectedImport && data) {
      const { name: importName, type } = selectedImport;
      const packageName = selectedPackage || '';

      try {
        if (type === 'other' && data.apiMap && data.apiMap[packageName] && data.apiMap[packageName][importName]) {
          const fileInfo = data.apiMap[packageName][importName].callFiles[filePath];
          if (fileInfo && fileInfo.lines) {
            lineNumbers = fileInfo.lines;
          }
        } else if (type === 'method' && data.methodMap && data.methodMap[packageName] && data.methodMap[packageName][importName]) {
          const fileInfo = data.methodMap[packageName][importName].callFiles[filePath];
          if (fileInfo && fileInfo.lines) {
            lineNumbers = fileInfo.lines;
          }
        } else if (type === 'type' && data.typeMap && data.typeMap[packageName] && data.typeMap[packageName][importName]) {
          const fileInfo = data.typeMap[packageName][importName].callFiles[filePath];
          if (fileInfo && fileInfo.lines) {
            lineNumbers = fileInfo.lines;
          }
        }
      } catch (err) {
        console.error('获取行号信息时出错:', err);
      }
    }

    // 只在有 scanSource 和 httpRepo 时构建 URL
    if (!data || !data._scanSource || data._scanSource.length === 0) {
      return { url: null, lineNumbers };
    }

    const parts = filePath.split('&');
    if (parts.length < 2) return { url: null, lineNumbers };

    const projectName = parts[0];
    const relativePath = parts[1];

    const sourceInfo = data._scanSource.find(src => src.name === projectName);
    if (!sourceInfo || !sourceInfo.httpRepo) return { url: null, lineNumbers };

    // 对路径进行URL转义，确保特殊字符正确处理
    const encodedPath = relativePath
      .split('/')
      .map(segment => encodeURIComponent(segment))
      .join('/');

    return {
      url: `${sourceInfo.httpRepo}/${encodedPath}`,
      lineNumbers
    };
  };

  // 获取当前选中包的导入项列表，根据活动标签筛选
  const getFilteredImportItems = (pkg: PackageDependency): ImportItem[] => {
    switch (activeTab) {
      case 'method':
        return pkg.methodItems;
      case 'type':
        return pkg.typeItems;
      case 'other':
        return pkg.otherItems;
      default:
        return pkg.allImportItems;
    }
  };

  // 判断依赖包中是否包含黑名单API
  const hasBlackListApi = (dep: PackageDependency): boolean => {
    return dep.allImportItems.some(item => item.isBlack);
  };

  // 获取依赖包中黑名单API的数量
  const getBlackListCount = (dep: PackageDependency): number => {
    return dep.allImportItems.filter(item => item.isBlack).length;
  };

  if (loading) {
    return <div className="flex justify-center p-8">{t('loading')}</div>;
  }

  if (error) {
    return <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4">
      {t('error')}: {error}
    </div>;
  }

  if (!data || !data.importItemMap) {
    return <div className="text-center p-8">{t('noData')}</div>;
  }

  const selectedPackageData = dependencies.find(dep => dep.packageName === selectedPackage);

  const handlePackageSelect = (packageName: string) => {
    setSelectedPackage(packageName);
  };

  const handleImportSelect = (importItem: ImportItem) => {
    setSelectedImport(importItem);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'method':
        return <Code size={16} className="text-green-500" />;
      case 'type':
        return <Type size={16} className="text-blue-500" />;
      default:
        return <Package size={16} className="text-gray-500" />;
    }
  };

  const getCategoryCount = (pkg?: PackageDependency) => {
    if (!pkg) return { all: 0, method: 0, type: 0, other: 0 };

    return {
      all: pkg.allImportItems.length,
      method: pkg.methodItems.length,
      type: pkg.typeItems.length,
      other: pkg.otherItems.length
    };
  };

  const categoryCount = getCategoryCount(selectedPackageData);

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* 搜索框 */}
      <div className="mb-4">
        <div className="w-full p-4 bg-gray-50 rounded-md">
          <input
            type="text"
            placeholder={t('searchDependencies')}
            className="w-full p-2 border border-gray-300 rounded-md"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* 包列表 */}
        <div className="w-full md:w-1/4 bg-gray-50 p-4 rounded-md shadow-sm max-h-[800px] overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">{t('packageList')} ({filteredDependencies.length})</h2>
          <div className="space-y-1">
            {filteredDependencies.map((dep) => (
              <div
                key={dep.packageName}
                className={`p-2 rounded-md cursor-pointer ${selectedPackage === dep.packageName ? 'bg-blue-100' : 'hover:bg-gray-200'
                  }`}
                onClick={() => handlePackageSelect(dep.packageName)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="font-medium">{dep.packageName}</span>
                    {hasBlackListApi(dep) && (
                      <AlertTriangle size={16} className="text-red-500 ml-1" />
                    )}
                  </div>
                  <span className="text-sm text-gray-500 ml-2">({dep.allImportItems.length})</span>
                </div>

                {/* 显示所有项目的版本 */}
                {dep.projectVersions && Object.keys(dep.projectVersions).length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {Object.entries(dep.projectVersions).map(([project, version]) => (
                      <div key={project} className="flex justify-between text-xs">
                        <span className="text-gray-600">{project}:</span>
                        <span className="text-green-600">{version}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 如果包含黑名单API，显示警告信息 */}
                {hasBlackListApi(dep) && (
                  <div className="mt-1 text-xs text-red-600 border border-red-300 bg-red-50 p-1 rounded flex items-center">
                    <AlertTriangle size={14} className="mr-1" />
                    {t('containsBlacklistedApis', { count: getBlackListCount(dep) })}
                  </div>
                )}

                {/* 显示分类数量 */}
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="flex items-center gap-1 text-green-600">
                    <Code size={12} /> {t('methods')}: {dep.methodItems.length}
                  </span>
                  <span className="flex items-center gap-1 text-blue-600">
                    <Type size={12} /> {t('types')}: {dep.typeItems.length}
                  </span>
                  <span className="flex items-center gap-1 text-gray-600">
                    <Package size={12} /> {t('other')}: {dep.otherItems.length}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 导入项列表 */}
        <div className="w-full md:w-1/3 bg-gray-50 p-4 rounded-md shadow-sm max-h-[800px] overflow-y-auto">
          <h2 className="text-xl font-bold mb-2">
            {selectedPackage ? `${selectedPackage} ${t('importItems')}` : t('selectPackage')}
            {selectedPackageData && ` (${categoryCount.all})`}
          </h2>

          {selectedPackageData && (
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                className={`px-3 py-1 text-sm rounded-full flex items-center gap-1 ${activeTab === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                onClick={() => setActiveTab('all')}
              >
                {t('all')} ({categoryCount.all})
              </button>
              <button
                className={`px-3 py-1 text-sm rounded-full flex items-center gap-1 ${activeTab === 'method' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700'
                  }`}
                onClick={() => setActiveTab('method')}
              >
                <Code size={14} /> {t('methods')} ({categoryCount.method})
              </button>
              <button
                className={`px-3 py-1 text-sm rounded-full flex items-center gap-1 ${activeTab === 'type' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
                  }`}
                onClick={() => setActiveTab('type')}
              >
                <Type size={14} /> {t('types')} ({categoryCount.type})
              </button>
              <button
                className={`px-3 py-1 text-sm rounded-full flex items-center gap-1 ${activeTab === 'other' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                onClick={() => setActiveTab('other')}
              >
                <Package size={14} /> {t('other')} ({categoryCount.other})
              </button>
            </div>
          )}

          {selectedPackageData ? (
            <div className="space-y-2">
              {getFilteredImportItems(selectedPackageData).map((item, index) => (
                <div
                  key={index}
                  className={`p-2 rounded-md cursor-pointer ${selectedImport?.name === item.name && selectedImport?.type === item.type
                    ? 'bg-blue-100'
                    : 'hover:bg-gray-200'
                    }`}
                  onClick={() => handleImportSelect(item)}
                >
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(item.type)}
                    <span className="font-mono">{item.name}</span>
                    {item.isBlack && (
                      <AlertTriangle size={16} className="text-red-500 ml-1" />
                    )}
                  </div>
                  {item.callOrigin && (
                    <div className="text-gray-500 text-sm mt-1">
                      {t('from')}: {item.callOrigin}
                    </div>
                  )}
                  {item.isBlack && (
                    <div className="text-red-600 text-sm font-semibold mt-1 border border-red-300 bg-red-50 p-1 rounded">
                      ⚠️ {t('blacklistedApiWarning')}
                    </div>
                  )}
                  <div className="text-sm text-gray-600 mt-1">
                    {t('calls')}: {item.callCount}
                  </div>
                </div>
              ))}
              {getFilteredImportItems(selectedPackageData).length === 0 && (
                <div className="text-gray-500 text-center py-4">
                  {t('noImportItems', { type: activeTab === 'all' ? '' : activeTab === 'method' ? t('method') : activeTab === 'type' ? t('type') : t('other') })}
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500 text-center">{t('selectPackageToViewImports')}</div>
          )}
        </div>

        {/* 调用文件详情 */}
        <div className="w-full md:w-5/12 bg-gray-50 p-4 rounded-md shadow-sm max-h-[800px] overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">
            {selectedImport ? (
              <div className="flex items-center gap-2">
                {getCategoryIcon(selectedImport.type)}
                <span>{selectedImport.name} {t('callDetails')}</span>
                {selectedImport.isBlack && (
                  <AlertTriangle size={16} className="text-red-500" />
                )}
                <span className="text-sm font-normal text-gray-600">
                  ({Object.keys(selectedImport.callFiles).length} {t('files')})
                </span>
              </div>
            ) : (
              t('selectImportItem')
            )}
          </h2>

          {selectedImport ? (
            <div className="space-y-4">
              {Object.entries(selectedImport.callFiles).map(([filePath], index) => {
                const { url: repoLink, lineNumbers } = getRepoLink(filePath);
                return (
                  <div key={index} className="border border-gray-200 rounded-md p-3 hover:bg-gray-100">
                    {repoLink ? (
                      <div>
                        <a
                          href={lineNumbers.length > 0 ? `${repoLink}#L${lineNumbers[0]}` : repoLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-blue-600 hover:underline flex items-center"
                        >
                          {filePath}
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    ) : (
                      <div className="font-mono text-blue-600">
                        {filePath}
                      </div>
                    )}

                    <div className="mt-1 text-xs text-gray-500">
                      {t('project')}: {filePath.split('&')[0]}
                    </div>

                    {lineNumbers.length > 0 && (
                      <div className="mt-2 text-xs">
                        <span className="font-semibold">{t('lineNumbers')}: </span>
                        {lineNumbers.map((line, i) => (
                          <span key={i} className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded mr-1">
                            {line}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-gray-500 text-center">{t('selectImportItemToViewDetails')}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportDependencyGraph; 