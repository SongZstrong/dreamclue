import type { SearchResult } from './vector-store';

export type RetrievalChannel = 'symbol' | 'lexical' | 'vector' | 'theory';

export interface RrfChannelInput {
  channel: RetrievalChannel;
  weight: number;
  results: SearchResult[];
}

export interface RrfOptions {
  k?: number;
  topK?: number;
}

const DEFAULT_RRF_K = 60;

function getResultKey(result: SearchResult): string {
  return `${result.file_id}:${result.chunk_id}`;
}

function getChunkTypeBoost(result: SearchResult): number {
  switch (result.chunk_type) {
    case 'symbol_entry':
      return 1.15;
    case 'theory_section':
      return 1.05;
    case 'case_or_example':
      return 1;
    case 'source_intro':
      return 0.82;
    default:
      return 1;
  }
}

function getQualityScore(result: SearchResult): number {
  if (typeof result.quality_score !== 'number') {
    return 1;
  }

  return Math.max(0.1, Math.min(result.quality_score, 1.2));
}

function getSourceWeight(result: SearchResult): number {
  if (typeof result.source_weight !== 'number') {
    return 1;
  }

  return Math.max(0.1, Math.min(result.source_weight, 2));
}

export function reciprocalRankFusion(
  channels: RrfChannelInput[],
  options: RrfOptions = {}
): SearchResult[] {
  const k = options.k || DEFAULT_RRF_K;
  const merged = new Map<
    string,
    {
      result: SearchResult;
      rrfScore: number;
      channels: RetrievalChannel[];
    }
  >();

  for (const channelInput of channels) {
    channelInput.results.forEach((result, index) => {
      const key = getResultKey(result);
      const existing = merged.get(key);
      const rankScore = channelInput.weight * (1 / (k + index + 1));

      if (existing) {
        existing.rrfScore += rankScore;
        existing.channels.push(channelInput.channel);
        return;
      }

      merged.set(key, {
        result: {
          ...result,
          sourceChannel: channelInput.channel,
        },
        rrfScore: rankScore,
        channels: [channelInput.channel],
      });
    });
  }

  const fused = Array.from(merged.values())
    .map(({ result, rrfScore, channels }) => {
      const finalScore =
        rrfScore *
        getSourceWeight(result) *
        getQualityScore(result) *
        getChunkTypeBoost(result);

      return {
        ...result,
        sourceChannel: channels[0],
        sourceChannels: Array.from(new Set(channels)),
        rrfScore,
        finalScore,
      };
    })
    .sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));

  return typeof options.topK === 'number'
    ? fused.slice(0, options.topK)
    : fused;
}
