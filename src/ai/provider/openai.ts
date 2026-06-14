import OpenAI from 'openai';
import type {
  AIProvider,
  AnalyzeDreamParams,
  AnalyzeDreamResult,
} from '../types';

/**
 * OpenAI provider implementation for dream analysis
 */
export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    this.client = new OpenAI({ apiKey });
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  public getProviderName(): string {
    return 'openai';
  }

  public async analyzeDream(
    params: AnalyzeDreamParams
  ): Promise<AnalyzeDreamResult> {
    const { title, content, mood, tags } = params;

    // Build the prompt for dream analysis
    const prompt = this.buildAnalysisPrompt(title, content, mood, tags);

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content:
              'You are a professional dream analyst with expertise in psychology and symbolism. Provide insightful, compassionate, and meaningful interpretations of dreams. Focus on potential meanings, emotions, and personal growth insights.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      });

      const analysis = response.choices[0]?.message?.content || '';

      if (!analysis) {
        throw new Error('No analysis generated from AI');
      }

      return { analysis };
    } catch (error) {
      console.error('OpenAI dream analysis error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to analyze dream'
      );
    }
  }

  private buildAnalysisPrompt(
    title: string,
    content: string,
    mood?: string,
    tags?: string[]
  ): string {
    let prompt = `Please analyze this dream:\n\nTitle: ${title}\n\nDream: ${content}`;

    if (mood) {
      prompt += `\n\nMood: ${mood}`;
    }

    if (tags && tags.length > 0) {
      prompt += `\n\nKey elements: ${tags.join(', ')}`;
    }

    prompt += `\n\nProvide a thoughtful analysis covering:
1. Possible symbolic meanings
2. Emotional themes and significance
3. Potential connections to waking life
4. Insights for personal reflection

Keep the analysis concise (3-4 paragraphs) and supportive.`;

    return prompt;
  }
}
