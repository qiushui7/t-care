/**
 * 中文本地化
 */
export const zh = {
  // Git 相关
  git: {
    notRepo: '当前目录不是Git仓库',
    errorGetChanges: '获取未提交变更时出错',
    noChanges: '没有找到未提交的变更',
    binaryFileCheck: '检查文件是否为二进制文件时出错',
    readFileError: '读取文件时出错',
  },

  // 代码审查相关
  review: {
    file: '文件',
    issues: '问题',
    suggestions: '建议',
    summary: '总结',
    strengths: '优点',
    noIssues: '未发现明显问题',
    noSuggestions: '无具体改进建议',
    goodQuality: '代码质量良好',
    errorReviewing: '审查过程中出现错误',
    reviewSeparately: '请尝试单独审查此文件',
    noContent: '无可审查内容',
    noFile: '无文件',
    noProvidedFiles: '未提供文件路径',
    provideFiles: '请提供至少一个文件路径进行审查',
    fileNotExist: '文件不存在',
    verifyPath: '请确认文件路径是否正确',
    errorReadingFile: '读取文件过程中出现错误',
    checkReadable: '请检查文件是否可读取，格式是否正确',
    filesExcluded: '个文件被排除审查（JSON文件）',
    excludedFiles: '被排除文件',
    installGit: '请确保安装了Git，并且当前目录是Git仓库',
    // 审查日志
    reviewingCode: '执行代码审查',
    focus: '重点',
  },

  // CLI 相关
  cli: {
    loadingConfig: '正在加载配置...',
    checkingFiles: '正在检查未提交的文件...',
    checkingSpecificFiles: (count: number) => `正在检查 ${count} 个文件...`,
    checkCompleted: '检查完成',
    noUncommittedFiles: '没有找到需要检查的未提交文件',
    totalChecked: (count: number) => `共检查了 ${count} 个文件`,
    checkFailed: (error: string) => `检查未提交文件失败: ${error}`,
    inspectFailed: (error: string) => `检查文件失败: ${error}`,
    fileNotExist: (file: string) => `文件不存在: ${file}`,
    noValidFiles: '没有找到有效的文件',
    allFilesNotExist: '所有指定的文件都不存在',
    configCreated: (path: string) => `已在 ${path} 创建默认配置文件`,
    cannotCreateConfig: (error: string) => `无法创建配置文件: ${error}`,
    currentConfig: '当前配置',
    configFailed: (error: string) => `配置操作失败: ${error}`,
    noOperationSpecified: '未指定操作，请使用 --init 或 --show 选项',
    error: '错误:',
    warning: '警告:',
    // 命令描述
    programDescription: '代码审查工具 - Code Analysis & Review Engine',
    helpOption: '显示帮助信息',
    helpCommand: '显示命令帮助',
    checkCommand: '检查未提交的代码文件',
    inspectCommand: '检查指定的代码文件',
    configCommand: '管理配置',
    depsAnalysisCommand: '依赖分析',
    filesList: '文件路径列表',
    // 选项描述
    detailedOption: '显示详细审查结果',
    formatOption: '输出格式 (text|json)',
    modelOption: '使用的模型',
    focusOption: '审查重点 (性能|安全|可读性|最佳实践)',
    excludeOption: '排除的文件扩展名 (例如: .json,.md)',
    languageOption: '输出语言，支持中文(zh)或英文(en)，也可在配置文件中设置',
    initOption: '初始化配置文件 (local|global) - 仅支持JavaScript格式',
    showOption: '显示当前配置',
  },

  // 依赖分析相关
  depsAnalysis: {
    title: '📊 依赖分析工具 - T-Care',
    loadingConfig: '正在读取配置文件...',
    configLoaded: '配置文件读取成功',
    analyzing: '正在分析项目依赖关系...',
    analyzeComplete: '依赖分析完成',
    generatingReport: '正在生成分析报告...',
    reportGenerated: '分析报告生成成功',
    reportSaved: (path: string) => `分析结果已保存到：${path}`,
    exportError: (error: string) => `导出分析结果时出错: ${error}`,
    startingService: '正在启动依赖分析可视化服务...',
    serviceStarted: '依赖分析可视化服务已启动',
    serviceStartError: (error: string) => `启动可视化展示时出错: ${error}`,
    analysisProgress: (projectName: string, type: string, current: number, total: number) =>
      `${projectName} ${type}分析进度: ${current}/${total}`,
    versionError: (error: string) => `处理依赖版本时出错: ${error}`,
    portInfo: (port: number) => `服务将在端口 ${port} 上启动`,
    accessUrl: (port: number) => `您可以访问 http://localhost:${port} 查看依赖关系图`,
    cacheLoaded: (number: number) => `已从缓存中恢复 ${number} 个文件`,
  },
};
