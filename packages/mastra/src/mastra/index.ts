import { Mastra } from '@mastra/core';
import { createLogger } from '@mastra/core/logger';
import * as agents from './agents';

export type { OpenAIChatModelId } from './agents';
export { Mastra } from '@mastra/core';

export const createMastra = (model: agents.OpenAIChatModelId): Mastra => {
  return new Mastra({
    agents: agents.createAgents(model),
    logger: createLogger({
      name: 'CONSOLE',
      level: 'info',
    }),
  });
};

export const mastra: Mastra = createMastra('gpt-4o-mini');
