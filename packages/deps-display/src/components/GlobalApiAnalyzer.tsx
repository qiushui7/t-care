import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CallFileInfo, DependencyJsonData } from '../types/dependencyTypes';
import { Globe, AlertTriangle } from 'lucide-react';

interface GlobalApiAnalyzerProps {
  data: DependencyJsonData;
  loading: boolean;
  error: string | null;
}

interface GlobalApiItem {
  name: string;
  callOrigin: string | null;
  callCount: number;
  callFiles: Record<string, CallFileInfo>;
  isBlack: boolean;
}

const GlobalApiAnalyzer: React.FC<GlobalApiAnalyzerProps> = ({ data, loading, error }) => {
  const { t } = useTranslation();
  const [globalApis, setGlobalApis] = useState<GlobalApiItem[]>([]);
  const [selectedApi, setSelectedApi] = useState<GlobalApiItem | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredApis, setFilteredApis] = useState<GlobalApiItem[]>([]);

  // 在组件挂载时解析浏览器API数据
  useEffect(() => {
    if (data?.globalMap) {
      try {
        // 解析浏览器API数据
        const globalEntries = 'global' in data.globalMap
          ? (data.globalMap as unknown as { global: Record<string, unknown> }).global
          : data.globalMap;

        // 定义API条目类型
        interface GlobalApiEntryItem {
          callOrigin: string | null;
          callNum: number;
          callFiles: Record<string, CallFileInfo>;
          isBlack?: boolean;
        }

        // 将条目转换为我们定义的GlobalApiItem类型
        const globalApiItems = Object.entries(globalEntries).map(([apiName, item]) => ({
          name: apiName,
          callOrigin: (item as unknown as GlobalApiEntryItem).callOrigin,
          callCount: (item as unknown as GlobalApiEntryItem).callNum,
          callFiles: (item as unknown as GlobalApiEntryItem).callFiles,
          isBlack: (item as unknown as GlobalApiEntryItem).isBlack || false,
        }));

        // 按调用次数排序
        const sortedApis = globalApiItems.sort((a, b) => {
          // 黑名单API优先
          if (a.isBlack && !b.isBlack) return -1;
          if (!a.isBlack && b.isBlack) return 1;
          // 按调用次数降序
          return b.callCount - a.callCount;
        });

        setGlobalApis(sortedApis);
        setFilteredApis(sortedApis);
      } catch (err) {
        console.error(t('errorParsingGlobalApiData'), err);
      }
    }
  }, [data, t]);

  // 搜索过滤浏览器API
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = globalApis.filter(api =>
        api.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredApis(filtered);
    } else {
      setFilteredApis(globalApis);
    }
  }, [searchTerm, globalApis]);

  // 处理API选择
  const handleApiSelect = (api: GlobalApiItem) => {
    setSelectedApi(api);
  };

  // 处理搜索输入变化
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // 从文件路径中提取仓库链接，包含行号引用
  const getRepoLink = (filePath: string): { url: string | null } => {

    // 只在有 scanSource 和 httpRepo 时构建 URL
    if (!data || !data.scanSource || data.scanSource.length === 0) {
      return { url: null };
    }

    const parts = filePath.split('&');
    if (parts.length < 2) return { url: null };

    const projectName = parts[0];
    const relativePath = parts[1];

    const sourceInfo = data.scanSource.find(src => src.name === projectName);
    if (!sourceInfo || !sourceInfo.httpRepo) return { url: null };

    // 对路径进行URL转义，确保特殊字符正确处理
    const encodedPath = relativePath
      .split('/')
      .map(segment => encodeURIComponent(segment))
      .join('/');

    return {
      url: `${sourceInfo.httpRepo}/${encodedPath}`,
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

  // 判断初始状态：无数据或数据中没有浏览器API
  const hasNoGlobalApis = !data || !data.globalMap || Object.keys(data.globalMap).length === 0;
  // 判断搜索结果为空的状态
  const hasEmptySearchResults = globalApis.length > 0 && filteredApis.length === 0;

  // 格式化行号
  const formatLines = (lines: number[], maxShow = 15): (number | string)[] => {
    if (lines.length <= maxShow) return lines;
    return [
      ...lines.slice(0, 15),
      '...',
    ];
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* 搜索栏始终显示，只要有数据 */}
      {(!hasNoGlobalApis || searchTerm) && (
        <div className="w-full p-4 bg-gray-50 rounded-md">
          <input
            type="text"
            placeholder={t('searchGlobalApi')}
            className="w-full p-2 border border-gray-300 rounded-md"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      )}

      {/* 无初始数据时显示空状态 */}
      {hasNoGlobalApis && (
        <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-lg">
          <Globe size={64} className="text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">{t('noGlobalApiData')}</h2>
          <p className="text-gray-500 text-center max-w-md">
            {t('noGlobalApiExplanation')}
          </p>
        </div>
      )}

      {/* 搜索结果为空时显示提示 */}
      {hasEmptySearchResults && (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">{t('noMatchingApis')}</h2>
          <p className="text-gray-500 text-center">
            {t('tryAdjustingSearch')}
          </p>
        </div>
      )}

      {/* 有搜索结果时显示内容区域 */}
      {filteredApis.length > 0 && (
        <div className="flex flex-col md:flex-row gap-4 min-h-[600px]">
          {/* 浏览器API列表 */}
          <div className="w-full md:w-1/3 bg-gray-50 p-4 rounded-md shadow-sm max-h-[800px] overflow-y-auto">
            <div className="p-3 bg-purple-50 rounded-md mb-4">
              <h2 className="text-lg font-semibold text-purple-800 mb-2">{t('globalApiView')} ({filteredApis.length})</h2>
              <p className="text-sm text-purple-700">
                {t('globalApiDescription')}
              </p>
            </div>

            <div className="space-y-2">
              {filteredApis.map((api, index) => (
                <div
                  key={index}
                  className={`p-2 rounded-md cursor-pointer ${selectedApi?.name === api.name ? 'bg-blue-100' : 'hover:bg-gray-200'
                    }`}
                  onClick={() => handleApiSelect(api)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Globe size={16} className="text-purple-500 mr-2" />
                      <span className="font-medium font-mono">{api.name}</span>
                      {api.isBlack && (
                        <AlertTriangle size={16} className="text-red-500 ml-1" />
                      )}
                    </div>
                    <span className="text-sm bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                      {api.callCount}{t('callCount')}
                    </span>
                  </div>
                  {api.isBlack && (
                    <div className="mt-1 text-xs text-red-600 border border-red-300 bg-red-50 p-1 rounded flex items-center">
                      <AlertTriangle size={14} className="mr-1" />
                      {t('blacklistedApiWarning')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 调用文件详情 */}
          <div className="w-full md:w-2/3 bg-gray-50 p-4 rounded-md shadow-sm max-h-[800px] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {selectedApi ? (
                <div className="flex items-center gap-2">
                  <Globe size={18} className="text-purple-500" />
                  <span>{selectedApi.name} {t('callDetails')}</span>
                  {selectedApi.isBlack && (
                    <AlertTriangle size={16} className="text-red-500" />
                  )}
                  <span className="text-sm font-normal text-gray-600">
                    ({Object.keys(selectedApi.callFiles).length} {t('files')})
                  </span>
                </div>
              ) : (
                t('selectGlobalApiToViewDetails')
              )}
            </h2>

            {selectedApi ? (
              <div className="space-y-4">
                {Object.entries(selectedApi.callFiles).map(([filePath, callFileInfo], index) => {
                  const { url: repoLink } = getRepoLink(filePath);
                  return (
                    <div key={index} className="border border-gray-200 rounded-md p-3 overflow-hidden hover:bg-gray-100">
                      {repoLink ? (
                        <div>
                          <a
                            href={callFileInfo.lines.length > 0 ? `${repoLink}#L${callFileInfo.lines[0]}` : repoLink}
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

                      <div className="mt-1 text-xs text-gray-500 flex items-center gap-4">
                        <span>{t('project')}: {callFileInfo.projectName}</span>
                        <span>{t('calls')}: {callFileInfo.lines.length}</span>
                        {callFileInfo.callOrigin && (
                          <span>{t('from')}: {callFileInfo.callOrigin}</span>
                        )}
                      </div>

                      {callFileInfo.lines.length > 0 && (
                        <div className="mt-2 text-xs">
                          <span className="font-semibold">{t('lineNumbers')}: </span>
                          {formatLines(callFileInfo.lines).map((line, i) =>
                            line === '...' ? (
                              <span key={i} className="mx-1 text-gray-400">...</span>
                            ) : (
                              <span key={i} className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded mr-1">
                                {line}
                              </span>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-gray-500 text-center p-8">
                <Globe size={48} className="text-purple-200 mx-auto mb-4" />
                <p>{t('selectGlobalApiFromList')}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalApiAnalyzer; 