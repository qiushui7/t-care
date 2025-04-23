import { readConfig } from '../utils';
import { DepsAnalysisService } from '@t-care/core';

export async function depsAnalysisCommand() {
  const config = await readConfig();
  const depsAnalysis = new DepsAnalysisService(config.depsAnalysis);
  const result = await depsAnalysis.run();
}
