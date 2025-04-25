import { DepsAnalysis, DepsAnalysisOptions } from '@t-care/deps-analysis';
import { Language } from '@t-care/utils';

export class DepsAnalysisService {
  private analysis: DepsAnalysis;

  constructor(options: DepsAnalysisOptions, language: Language) {
    this.analysis = new DepsAnalysis(options, language);
  }

  async run() {
    return this.analysis.analysis();
  }
}
