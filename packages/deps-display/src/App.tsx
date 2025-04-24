import { useState, useEffect } from 'react';
import { DependencyJsonData } from './types/dependencyTypes';
import ImportDependencyGraph from './components/ImportDependencyGraph';
import BrowserApiAnalyzer from './components/BrowserApiAnalyzer';
import { Package, Globe } from 'lucide-react';

function App() {
  const [data, setData] = useState<DependencyJsonData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'browserApi'>('list');

  // 在页面加载时直接读取example-dependency.json文件
  useEffect(() => {
    const loadDependencyFile = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/example-dependency.json');
        if (!response.ok) {
          throw new Error(`无法加载依赖数据: ${response.statusText}`);
        }

        const jsonData = await response.json();
        setData(jsonData as DependencyJsonData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '加载依赖数据时出错';
        setError(errorMessage);
        console.error('Error loading dependency file:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDependencyFile();
  }, []);

  // 检查当前数据是否包含浏览器API数据
  const hasBrowserApiData = data?.browserMap && Object.keys(data.browserMap).length > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-center mb-6">依赖分析工具</h1>

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
              <span>包依赖视图</span>
            </button>
            <button
              className={`px-4 py-2 rounded-md flex items-center gap-2 ${viewMode === 'browserApi'
                ? 'bg-purple-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${!hasBrowserApiData ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => hasBrowserApiData && setViewMode('browserApi')}
              disabled={!hasBrowserApiData}
              title={!hasBrowserApiData ? '无浏览器API数据' : '浏览器API分析'}
            >
              <Globe size={18} />
              <span>浏览器API</span>
              {hasBrowserApiData && data?.browserMap &&
                Object.values(data.browserMap).some(api => api.isBlack) && (
                  <span className="bg-red-100 text-red-600 text-xs px-1.5 rounded-full ml-1">
                    有风险
                  </span>
                )}
            </button>
          </div>
        )}
      </header>

      {loading && (
        <div className="flex justify-center p-8">
          <div className="text-lg text-gray-600">加载依赖数据中...</div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4">
          错误: {error}
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
          ) : (
            <BrowserApiAnalyzer
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

