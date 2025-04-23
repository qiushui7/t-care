import { DepsAnalysis, DepsAnalysisOptions } from '@t-care/deps-analysis';

export class DepsAnalysisService {
  private analysis: DepsAnalysis;

  constructor(options: DepsAnalysisOptions) {
    this.analysis = new DepsAnalysis(options);
  }

  async run() {
    return this.analysis.analysis();
  }
}
