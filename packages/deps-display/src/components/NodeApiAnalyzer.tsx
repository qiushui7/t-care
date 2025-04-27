import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CallFileInfo, DependencyJsonData } from '../types/dependencyTypes';
import { Server, AlertTriangle } from 'lucide-react';

interface NodeApiAnalyzerProps {
  data: DependencyJsonData;
  loading: boolean;
  error: string | null;
}

interface NodeApiItem {
  moduleName: string;
  totalCallNum: number;
  allUsedApiItems: {
    name: string,
    callNum: number,
    callOrigin: string | null,
    callFiles: Record<string, CallFileInfo>,
    isBlack: boolean
  }[];
}

const NodeApiAnalyzer: React.FC<NodeApiAnalyzerProps> = ({ data, loading, error }) => {
  const { t } = useTranslation();
  const [nodeApis, setNodeApis] = useState<NodeApiItem[]>([]);
  const [selectedApi, setSelectedApi] = useState<NodeApiItem | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredApis, setFilteredApis] = useState<NodeApiItem[]>([]);

  // 在组件挂载时解析Node API数据
  useEffect(() => {
    if (data?.importItemMap) {
      try {
        // 提取Node模块类型的导入项
        const nodeApiItems: NodeApiItem[] = [];
        const { importItemMap, methodMap, typeMap, apiMap } = data;
        const projectNames = data._scanSource ? data._scanSource.map(src => src.name) : [];

        // 处理importItemMap中的模块
        Object.entries(importItemMap).forEach(([moduleName, moduleInfo]) => {
          if (typeof moduleInfo === 'object' && projectNames.some(name => moduleInfo[name] === 'NODE_MODULE')) {
            // 添加模块本身作为一个条目
            const item: NodeApiItem = {
              moduleName,
              totalCallNum: 0,
              allUsedApiItems: []
            }
            let tempCallNum = 0;
            const methodItems = Object.entries(methodMap?.[moduleName] || {}).map(([methodName, item]) => {
              tempCallNum += item.callNum;
              return {
                name: methodName,
                callNum: item.callNum,
                callOrigin: item.callOrigin,
                callFiles: item.callFiles,
                isBlack: item.isBlack || false
              }
            });
            const typeItems = Object.entries(typeMap?.[moduleName] || {}).map(([typeName, item]) => {
              tempCallNum += item.callNum;
              return {
                name: typeName,
                callNum: item.callNum,
                callOrigin: item.callOrigin,
                callFiles: item.callFiles,
                isBlack: item.isBlack || false
              }
            })
            const otherItems = Object.entries(apiMap?.[moduleName] || {}).map(([itemName, item]) => {
              tempCallNum += item.callNum;
              return {
                name: itemName,
                callNum: item.callNum,
                callOrigin: item.callOrigin,
                callFiles: item.callFiles,
                isBlack: item.isBlack || false
              }
            })
            item.allUsedApiItems = [...methodItems, ...typeItems, ...otherItems];
            item.totalCallNum = tempCallNum;
            nodeApiItems.push(item);
          }
        });

        // 按调用次数排序
        const sortedApis = nodeApiItems.sort((a, b) => b.allUsedApiItems.length - a.allUsedApiItems.length);

        setNodeApis(sortedApis);
        setFilteredApis(sortedApis);
      } catch (err) {
        console.error(t('errorParsingNodeApiData'), err);
      }
    }
  }, [data, t]);

  // 搜索过滤Node API
  useEffect(() => {
    let filtered = nodeApis;

    // 移除类型过滤
    // 只保留搜索过滤功能
    if (searchTerm.trim()) {
      filtered = filtered.filter(api =>
        api.allUsedApiItems.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredApis(filtered);
  }, [searchTerm, nodeApis]);

  // 处理API选择
  const handleApiSelect = (api: NodeApiItem) => {
    setSelectedApi(api);
  };

  // 处理搜索输入变化
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // 从文件路径中提取仓库链接，包含行号引用
  const getRepoLink = (apiItem: NodeApiItem['allUsedApiItems'][0], filePath: string): { url: string | null; lineNumbers: number[] } => {
    // 即使没有 scanSource 或 httpRepo，我们也要尝试获取行号信息
    let lineNumbers: number[] = [];

    // 从apiData中查找行号信息
    if (apiItem && apiItem.callFiles && filePath in apiItem.callFiles) {
      try {
        const fileInfo = apiItem.callFiles[filePath];
        if (fileInfo && fileInfo.lines) {
          lineNumbers = fileInfo.lines;
        }
      } catch (err) {
        console.error(t('errorGettingLineInfo'), err);
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

  if (loading) {
    return <div className="flex justify-center p-8">{t('loading')}</div>;
  }

  if (error) {
    return <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4">
      {t('error')}: {error}
    </div>;
  }

  // 判断初始状态：无数据或数据中没有 Node API
  const hasNoInitialNodeApis = !data || !data.importItemMap || nodeApis.length === 0;
  // 判断搜索结果为空的状态
  const hasEmptySearchResults = nodeApis.length > 0 && filteredApis.length === 0;

  return (
    <div className="flex flex-col space-y-4">
      {/* 搜索栏始终显示，只要数据已加载 */}
      {(!hasNoInitialNodeApis || searchTerm) && (
        <div className="w-full p-4 bg-gray-50 rounded-md">
          <div className="flex flex-col md:flex-row justify-between gap-2">
            <input
              type="text"
              placeholder={t('searchNodeApi') || 'Search Node.js APIs...'}
              className="w-full p-2 border border-gray-300 rounded-md"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>
      )}

      {/* 无初始数据时显示空状态 */}
      {hasNoInitialNodeApis && (
        <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-lg">
          <Server size={64} className="text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">{t('noNodeApiData') || 'No Node API data available'}</h2>
          <p className="text-gray-500 text-center max-w-md">
            {t('noNodeApiExplanation') || 'No Node.js API usage was detected in the analyzed code.'}
          </p>
        </div>
      )}

      {/* 搜索结果为空时显示提示 */}
      {hasEmptySearchResults && (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">{t('noMatchingApis') || 'No matching APIs found'}</h2>
          <p className="text-gray-500 text-center">
            {t('tryAdjustingSearch') || 'Try adjusting your search term to find results.'}
          </p>
        </div>
      )}

      {/* 有搜索结果时显示内容区域 */}
      {filteredApis.length > 0 && (
        <div className="flex flex-col md:flex-row gap-4">
          {/* Node API列表 */}
          <div className="w-full md:w-1/3 bg-gray-50 p-4 rounded-md shadow-sm max-h-[800px] overflow-y-auto">
            <div className="p-3 bg-blue-50 rounded-md mb-4">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">{t('nodeApiView') || 'Node.js API Usage'} ({filteredApis.length})</h2>
              <p className="text-sm text-blue-700">
                {t('nodeApiDescription') || 'List of Node.js APIs used in the project.'}
              </p>
            </div>

            <div className="space-y-2">
              {filteredApis.map((api, index) => (
                <div
                  key={index}
                  className={`p-2 rounded-md cursor-pointer ${selectedApi?.moduleName === api.moduleName ? 'bg-blue-100' : 'hover:bg-gray-200'}`}
                  onClick={() => handleApiSelect(api)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Server size={16} className="text-blue-500 mr-2" />
                      <span className="font-medium font-mono">{api.moduleName}</span>
                    </div>
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      {api.totalCallNum}{t('callCount') || ' items'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 调用文件详情 */}
          <div className="w-full md:w-2/3 bg-gray-50 p-4 rounded-md shadow-sm max-h-[800px] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {selectedApi ? (
                <div className="flex items-center gap-2">
                  <Server size={18} className="text-blue-500" />
                  <span>{selectedApi.moduleName} {t('callDetails') || 'Call Details'}</span>
                  <span className="text-sm font-normal text-gray-600">
                    ({selectedApi.allUsedApiItems.length} {t('items') || 'items'})
                  </span>
                </div>
              ) : (
                t('selectNodeApiToViewDetails') || 'Select a Node.js API to view details'
              )}
            </h2>

            {selectedApi ? (
              <div className="space-y-4">
                {selectedApi.allUsedApiItems.map((apiItem, itemIndex) => (
                  <div key={itemIndex} className="border border-gray-200 rounded-md p-3">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium font-mono flex items-center">
                        <span>{apiItem.name}</span>
                        {apiItem.isBlack && (
                          <AlertTriangle size={16} className="text-red-500 ml-1" />
                        )}
                      </div>
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        {apiItem.callNum || Object.keys(apiItem.callFiles || {}).length} {t('calls') || 'calls'}
                      </span>
                    </div>

                    {apiItem.isBlack && (
                      <div className="mt-1 mb-2 text-xs text-red-600 border border-red-300 bg-red-50 p-1 rounded flex items-center">
                        <AlertTriangle size={14} className="mr-1" />
                        {t('blacklistedApiWarning') || 'This API is blacklisted.'}
                      </div>
                    )}

                    <div className="mt-2">
                      <h3 className="text-sm font-semibold mb-1">{t('callFiles') || 'Call Files'}:</h3>
                      <div className="space-y-2 pl-2">
                        {Object.entries(apiItem.callFiles || {}).map(([filePath], fileIndex) => {
                          const { url: repoLink, lineNumbers } = getRepoLink(apiItem, filePath);
                          return (
                            <div key={fileIndex} className="text-sm hover:bg-gray-100 p-1 rounded">
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
                                {t('project') || 'Project'}: {filePath.split('&')[0]}
                              </div>

                              {lineNumbers.length > 0 && (
                                <div className="mt-1 text-xs">
                                  <span className="font-semibold">{t('lineNumbers') || 'Line Numbers'}: </span>
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
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center p-8">
                <Server size={48} className="text-blue-200 mx-auto mb-4" />
                <p>{t('selectNodeApiFromList') || 'Select a Node.js API from the list to view details.'}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NodeApiAnalyzer; 