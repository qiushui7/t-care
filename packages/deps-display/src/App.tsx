import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { DependencyJsonData } from './types/dependencyTypes';
import ImportDependencyGraph from './components/ImportDependencyGraph';
import BrowserApiAnalyzer from './components/BrowserApiAnalyzer';
import NodeApiAnalyzer from './components/NodeApiAnalyzer';
import GhostDependenciesWarning from './components/GhostDependenciesWarning';
import { Package, Globe, Server } from 'lucide-react';

function App() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState<DependencyJsonData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'browserApi' | 'nodeApi'>('list');

  // 在组件挂载时根据路径设置语言
  useEffect(() => {
    const path = location.pathname;
    const langCode = path.startsWith('/en') ? 'en' : path.startsWith('/zh') ? 'zh' : null;

    if (langCode && langCode !== i18n.language) {
      i18n.changeLanguage(langCode);
    } else if (!langCode) {
      // 如果路径不包含语言代码，则根据当前语言设置路径
      const newPath = `/${i18n.language}${path === '/' ? '' : path}`;
      navigate(newPath, { replace: true });
    }
  }, [location.pathname, i18n, navigate]);

  // 语言切换函数
  const changeLanguage = (lang: string) => {
    const currentPath = location.pathname;
    const pathWithoutLang = currentPath.replace(/^\/(zh|en)/, '');
    const newPath = `/${lang}${pathWithoutLang || ''}`;
    navigate(newPath);
  };

  // 在页面加载时尝试读取deps-analysis-result.json或example-dependency.json文件
  useEffect(() => {
    const loadDependencyFile = async () => {
      try {
        setLoading(true);
        setError(null);

        // 首先尝试加载最新生成的分析结果文件
        try {
          const resultResponse = await fetch('/deps-analysis-result.json');
          if (resultResponse.ok) {
            const jsonData = await resultResponse.json();
            setData(jsonData as DependencyJsonData);
            return; // 如果成功加载，直接返回
          }
        } catch {
          console.log(t('errorLoading'));
        }

        // 如果最新结果不可用，尝试加载示例文件
        const exampleResponse = await fetch('/example-dependency.json');
        if (!exampleResponse.ok) {
          throw new Error(`${t('errorLoading')}: ${exampleResponse.statusText}`);
        }

        const jsonData = await exampleResponse.json();
        setData(jsonData as DependencyJsonData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : t('errorLoading');
        setError(errorMessage);
        console.error('Error loading dependency file:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDependencyFile();
  }, [t]);

  // 检查当前数据是否包含浏览器API数据
  const hasBrowserApiData = data?.browserMap && Object.keys(data.browserMap).length > 0;

  // 检查数据是否包含Node API数据
  const hasNodeApiData = data?.importItemMap &&
    Object.values(data.importItemMap).some(moduleInfo =>
      Object.values(moduleInfo).some(item => item === 'NODE_MODULE')
    );

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-2xl font-bold text-center">{t('appTitle')}</h1>
          <div className="flex items-center">
            <button
              onClick={() => changeLanguage('zh')}
              className={`px-3 py-1 rounded-l-md ${i18n.language === 'zh' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
            >
              {t('chinese')}
            </button>
            <button
              onClick={() => changeLanguage('en')}
              className={`px-3 py-1 rounded-r-md ${i18n.language === 'en' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
            >
              {t('english')}
            </button>
          </div>
        </div>

        {/* 添加幽灵依赖警告 */}
        {data && data.ghostDependenciesWarn && (
          <div className="mb-4">
            <GhostDependenciesWarning ghostDependencies={data.ghostDependenciesWarn} />
          </div>
        )}

        {data && !loading && (
          <div className="flex justify-center gap-3">
            <button
              className={`px-4 py-2 rounded-md flex items-center gap-2 ${viewMode === 'list'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              onClick={() => setViewMode('list')}
            >
              <Package size={18} />
              <span>{t('dependencyView')}</span>
            </button>
            <button
              className={`px-4 py-2 rounded-md flex items-center gap-2 ${viewMode === 'browserApi'
                ? 'bg-purple-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${!hasBrowserApiData ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => hasBrowserApiData && setViewMode('browserApi')}
              disabled={!hasBrowserApiData}
              title={!hasBrowserApiData ? t('noBrowserApiData') : t('browserApiView')}
            >
              <Globe size={18} />
              <span>{t('browserApiView')}</span>
              {hasBrowserApiData && data?.browserMap &&
                Object.values(data.browserMap).some(api => api.isBlack) && (
                  <span className="bg-red-100 text-red-600 text-xs px-1.5 rounded-full ml-1">
                    {t('hasRisk')}
                  </span>
                )}
            </button>
            <button
              className={`px-4 py-2 rounded-md flex items-center gap-2 ${viewMode === 'nodeApi'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${!hasNodeApiData ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => hasNodeApiData && setViewMode('nodeApi')}
              disabled={!hasNodeApiData}
              title={!hasNodeApiData ? t('noNodeApiData') : t('nodeApiView')}
            >
              <Server size={18} />
              <span>{t('nodeApiView')}</span>
            </button>
          </div>
        )}
      </header>

      {loading && (
        <div className="flex justify-center p-8">
          <div className="text-lg text-gray-600">{t('loading')}</div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4">
          {t('error')}: {error}
        </div>
      )}

      {data && !loading && (
        <div className="mb-8">
          {viewMode === 'list' ? (
            <ImportDependencyGraph
              data={data}
              loading={false}
              error={null}
            />
          ) : viewMode === 'browserApi' ? (
            <BrowserApiAnalyzer
              data={data}
              loading={false}
              error={null}
            />
          ) : (
            <NodeApiAnalyzer
              data={data}
              loading={false}
              error={null}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default App;

