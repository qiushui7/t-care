/**
 * 启动依赖可视化服务的配置选项
 */
export interface DepsDisplayOptions {
  /**
   * 需要展示的JSON文件路径
   */
  jsonFilePath?: string;

  /**
   * 服务器端口号，默认3080
   */
  port?: number;

  /**
   * 语言设置，默认中文
   */
  language?: Language;
}

/**
 * 启动依赖可视化服务
 * @param options 配置选项
 * @returns 返回包含服务器实例和访问URL的对象
 */
export function startDepsDisplay(options?: DepsDisplayOptions);
