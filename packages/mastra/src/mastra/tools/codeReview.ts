import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// 用于代码审查的工具
export const reviewCode = createTool({
  id: 'Review Frontend Code',
  description: '分析前端代码(JavaScript/TypeScript/React/Vue等)并提供改进建议',
  inputSchema: z.object({
    code: z.string().describe('需要审查的代码内容'),
    language: z.enum(['javascript', 'typescript', 'jsx', 'tsx', 'vue']).describe('代码的语言类型'),
    fileName: z.string().optional().describe('可选的文件名，用于帮助理解代码上下文'),
    focus: z
      .enum(['all', 'performance', 'security', 'accessibility', 'bestPractices', 'maintainability'])
      .optional()
      .default('all')
      .describe('审查重点，默认为全面审查'),
  }),
  execute: async ({ context }) => {
    const { code, language, fileName, focus } = context;

    // 这里只是收集信息传递给Agent，实际审查逻辑由LLM完成
    return {
      codeToReview: code,
      language,
      fileName: fileName || '未指定文件名',
      focus,
      timestamp: new Date().toISOString(),
    };
  },
});

// 用于分析依赖包的工具
export const analyzeDependencies = createTool({
  id: 'Analyze Package Dependencies',
  description: '分析package.json中的依赖并检查问题（过时版本、安全问题等）',
  inputSchema: z.object({
    packageJson: z.string().describe('package.json的内容'),
  }),
  execute: async ({ context }) => {
    const { packageJson } = context;

    try {
      const pkgData = JSON.parse(packageJson);
      const dependencies = {
        ...(pkgData.dependencies || {}),
        ...(pkgData.devDependencies || {}),
      };

      return {
        totalDependencies: Object.keys(dependencies).length,
        dependenciesList: dependencies,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        error: '无法解析package.json',
        timestamp: new Date().toISOString(),
      };
    }
  },
});

// 用于分析代码复杂度的工具
export const analyzeComplexity = createTool({
  id: 'Analyze Code Complexity',
  description: '分析代码复杂度并提供简化建议',
  inputSchema: z.object({
    code: z.string().describe('需要分析复杂度的代码'),
    language: z.enum(['javascript', 'typescript', 'jsx', 'tsx', 'vue']).describe('代码的语言类型'),
  }),
  execute: async ({ context }) => {
    const { code, language } = context;

    // 基本分析：行数、函数数量等
    const lines = code.split('\n').length;
    const functionMatches = code.match(/function\s+\w+\s*\(/g) || [];
    const arrowFunctionMatches = code.match(/=>\s*{/g) || [];
    const functionsCount = functionMatches.length + arrowFunctionMatches.length;

    return {
      lines,
      functionsCount,
      language,
      timestamp: new Date().toISOString(),
    };
  },
});
