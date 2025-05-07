/**
 * Care Configuration File
 */

export default {
  // OpenAI API Key
  openaiKey: 'your_openai_api_key_here',

  // Model to use, default is gpt-4o-mini
  model: 'gpt-4o-mini',

  // Whether to show detailed information
  detailed: false,

  // Review focus: 'all' | 'performance' | 'security' | 'maintainability' | 'readability' | 'bestPractices'
  focus: 'all',

  // Excluded file extensions
  excludeExtensions: ['.json'],

  // Output language (zh: Chinese, en: English)
  language: 'zh',

  // Dependency analysis configuration
  depsAnalysis: {
    // Scan sources
    scanSource: [
      {
        name: 'cli',
        include: ['packages/cli/src'],
        exclude: ['**/node_modules/**'],
        httpRepo: 'https://github.com/qiushui7/t-care',
        // format: (str) => {
        //   return str.replace('','')
        // },
        packageJsonPath: 'packages/cli/package.json',
        tsConfigPath: 'packages/cli/tsconfig.json',
      },
      {
        name: 'deps-analysis',
        include: ['packages/deps-analysis/src'],
        exclude: ['**/node_modules/**'],
        httpRepo: 'https://github.com/qiushui7/t-care',
        packageJsonPath: 'packages/deps-analysis/package.json',
        tsConfigPath: 'packages/deps-analysis/tsconfig.json',
      },
      {
        name: 'deps-display',
        include: ['packages/deps-display/src'],
        exclude: ['**/node_modules/**'],
        httpRepo: 'https://github.com/qiushui7/t-care',
        packageJsonPath: 'packages/deps-display/package.json',
        tsConfigPath: 'packages/deps-display/tsconfig.json',
      },
      {
        name: 'mastra',
        include: ['packages/mastra/src'],
        exclude: ['**/node_modules/**'],
        httpRepo: 'https://github.com/qiushui7/t-care',
        packageJsonPath: 'packages/mastra/package.json',
        tsConfigPath: 'packages/mastra/tsconfig.json',
      },
      {
        name: 'utils',
        include: ['packages/utils/src'],
        exclude: ['**/node_modules/**'],
        httpRepo: 'https://github.com/qiushui7/t-care',
        packageJsonPath: 'packages/utils/package.json',
        tsConfigPath: 'packages/utils/tsconfig.json',
      },
    ],
    // Analysis targets (packages or modules to focus on)
    analysisTarget: [],

    // Blacklist (packages or modules to warn)
    blackList: [],

    // Browser APIs (browser APIs to monitor)
    browserApis: [],

    // Whether to scan Vue files
    isScanVue: false,
  },
};
