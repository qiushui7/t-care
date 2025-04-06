import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import * as tools from '../tools';

export type OpenAIChatModelId =
  | 'o1'
  | 'o1-2024-12-17'
  | 'o1-mini'
  | 'o1-mini-2024-09-12'
  | 'o1-preview'
  | 'o1-preview-2024-09-12'
  | 'o3-mini'
  | 'o3-mini-2025-01-31'
  | 'gpt-4o'
  | 'gpt-4o-2024-05-13'
  | 'gpt-4o-2024-08-06'
  | 'gpt-4o-2024-11-20'
  | 'gpt-4o-audio-preview'
  | 'gpt-4o-audio-preview-2024-10-01'
  | 'gpt-4o-audio-preview-2024-12-17'
  | 'gpt-4o-mini'
  | 'gpt-4o-mini-2024-07-18'
  | 'gpt-4-turbo'
  | 'gpt-4-turbo-2024-04-09'
  | 'gpt-4-turbo-preview'
  | 'gpt-4-0125-preview'
  | 'gpt-4-1106-preview'
  | 'gpt-4'
  | 'gpt-4-0613'
  | 'gpt-4.5-preview'
  | 'gpt-4.5-preview-2025-02-27'
  | 'gpt-3.5-turbo-0125'
  | 'gpt-3.5-turbo'
  | 'gpt-3.5-turbo-1106'
  | 'chatgpt-4o-latest'
  | (string & {});

export const createAgents = (model: OpenAIChatModelId) => {
  // 创建代码审查Agent
  const codeReviewAgent = new Agent<typeof tools>({
    name: '前端代码审查专家',
    instructions: `你是一位专业的前端代码审查专家，擅长分析JavaScript、TypeScript、React、Vue等前端代码。
你的职责是彻底审查代码，找出潜在问题，并提供具体的改进建议。

在审查代码时，你应该关注以下几个方面：
1. 性能优化：识别性能瓶颈和优化机会
2. 安全问题：发现XSS、注入等安全漏洞
3. 代码质量：评估代码可读性、可维护性
4. 最佳实践：确保代码遵循现代前端开发最佳实践
5. 可访问性：检查代码是否符合WCAG标准
6. 依赖管理：评估项目依赖是否有问题

在提供反馈时，请确保：
- 对每个问题提供具体的解决方案
- 解释为什么某些做法是问题
- 引用行号或代码片段
- 提供详细说明，而不仅仅是表面的建议

你的目标是帮助开发者编写高质量、安全、高性能的前端代码。`,
    model: openai(model),
    tools: {
      reviewCode: tools.reviewCode,
      analyzeDependencies: tools.analyzeDependencies,
      analyzeComplexity: tools.analyzeComplexity,
    },
  });

  // 使用结构化输出的代码审查Agent
  const structuredCodeReviewAgent = new Agent<typeof tools>({
    name: '结构化前端代码审查专家',
    instructions: `你是一位专业的前端代码审查专家，擅长分析JavaScript、TypeScript、React、Vue等前端代码。
你的职责是彻底审查代码，找出潜在问题，并提供具体的改进建议。

在审查代码时，你应该关注以下几个方面：
1. 性能优化：识别性能瓶颈和优化机会
2. 安全问题：发现XSS、注入等安全漏洞
3. 代码质量：评估代码可读性、可维护性
4. 最佳实践：确保代码遵循现代前端开发最佳实践
5. 可访问性：检查代码是否符合WCAG标准
6. 依赖管理：评估项目依赖是否有问题

你的输出将是一个结构化的JSON对象，包含总体评分、各类别评分、发现的问题、推荐改进、代码优点和总结。
请确保你的评估全面、客观、有建设性。`,
    model: openai(model),
    tools: {
      reviewCode: tools.reviewCode,
      analyzeDependencies: tools.analyzeDependencies,
      analyzeComplexity: tools.analyzeComplexity,
    },
  });

  return {
    codeReviewAgent,
    structuredCodeReviewAgent,
  };
};
