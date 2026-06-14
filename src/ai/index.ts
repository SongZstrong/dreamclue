import { websiteConfig } from '@/config/website';
import { OpenAIProvider } from './provider/openai';
import type {
  AIProvider,
  AIProviderName,
  AnalyzeDreamParams,
  AnalyzeDreamResult,
} from './types';

type AIProviderFactory = () => AIProvider;

const providerRegistry: Partial<Record<AIProviderName, AIProviderFactory>> = {
  openai: () => new OpenAIProvider(),
};

let aiProvider: AIProvider | null = null;

function createAIProvider(): AIProvider {
  const name = websiteConfig.ai?.provider;
  if (!name) throw new Error('ai.provider is required in websiteConfig.');
  const factory = providerRegistry[name];
  if (!factory) throw new Error(`Unsupported AI provider: ${name}.`);
  return factory();
}

/**
 * Get the AI provider
 * @returns current AI provider instance
 * @throws Error if provider is not initialized
 */
export const getAIProvider = (): AIProvider => {
  if (!aiProvider) aiProvider = createAIProvider();
  return aiProvider;
};

/**
 * Analyze a dream using AI
 * @param params Dream analysis parameters
 * @returns Analysis result
 */
export const analyzeDream = async (
  params: AnalyzeDreamParams
): Promise<AnalyzeDreamResult> => {
  const provider = getAIProvider();
  return provider.analyzeDream(params);
};
