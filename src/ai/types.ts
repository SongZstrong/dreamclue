export type AIProviderName = 'openai';

export interface AnalyzeDreamParams {
  title: string;
  content: string;
  mood?: string;
  tags?: string[];
}

export interface AnalyzeDreamResult {
  analysis: string;
}

export interface AIProvider {
  /**
   * Get the provider name
   */
  getProviderName(): string;

  /**
   * Analyze a dream and return insights
   */
  analyzeDream(params: AnalyzeDreamParams): Promise<AnalyzeDreamResult>;
}
