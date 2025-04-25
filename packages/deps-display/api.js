import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 定义服务器参数
const DEFAULT_PORT = 3080;

/**
 * 启动依赖可视化服务
 * @param {Object} options 配置选项
 * @param {string} options.jsonFilePath 需要展示的JSON文件路径
 * @param {number} options.port 服务器端口号，默认3080
 * @param {boolean} options.autoOpenBrowser 是否自动打开浏览器，默认true
 */
export async function startDepsDisplay(options = {}) {
  const { jsonFilePath = '', port = DEFAULT_PORT, language = 'zh' } = options;
  console.log('language', language);

  try {
    // 项目根目录
    const rootDir = __dirname;
    // 静态资源目录
    const distDir = path.resolve(rootDir, 'dist');
    // 检查dist目录是否存在
    if (!fs.existsSync(distDir)) {
      throw new Error('未找到构建后的文件，请先运行 "pnpm build"');
    }

    // 如果指定了JSON文件，复制到dist目录
    if (jsonFilePath) {
      const absoluteJsonPath = path.isAbsolute(jsonFilePath) ? jsonFilePath : path.resolve(process.cwd(), jsonFilePath);

      if (!fs.existsSync(absoluteJsonPath)) {
        throw new Error(`指定的JSON文件不存在: ${absoluteJsonPath}`);
      }

      const targetPath = path.join(distDir, 'deps-analysis-result.json');
      try {
        fs.copyFileSync(absoluteJsonPath, targetPath);
      } catch (error) {
        throw new Error(`复制JSON文件时出错: ${error.message}`);
      }
    }

    // 执行npm run preview
    spawn('npm', ['run', 'preview', '--', '--port', port.toString(), '--open', language], {
      cwd: rootDir,
      stdio: 'inherit', // 继承父进程的标准输入/输出/错误
      shell: true, // 使用shell，确保在各平台上都能正常工作
    });
  } catch (error) {
    console.error('启动依赖分析服务时出错:', error);
    throw error;
  }
}
