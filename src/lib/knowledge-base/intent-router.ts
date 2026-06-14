import {
  COMPARE_MARKERS_EN,
  COMPARE_MARKERS_ZH,
  FOLLOW_UP_MARKERS_EN,
  FOLLOW_UP_MARKERS_ZH,
  SYMBOL_LOOKUP_PATTERNS,
} from './dream-taxonomy';
import type {
  IntentDecision,
  IntentScore,
  QueryIntent,
  RewrittenQuery,
} from './query-types';

function hasMarker(text: string, markers: string[]): boolean {
  const lowered = text.toLowerCase();
  return markers.some((marker) =>
    /[a-zA-Z]/.test(marker)
      ? lowered.includes(marker.toLowerCase())
      : text.includes(marker)
  );
}

function createScore(intent: QueryIntent): IntentScore {
  return {
    intent,
    score: 0,
    reasons: [],
  };
}

function rankScores(scores: IntentScore[]): IntentScore[] {
  return [...scores].sort((a, b) => b.score - a.score);
}

export function detectIntent(rewritten: RewrittenQuery): IntentDecision {
  const query = rewritten.originalQuery;
  const normalized = rewritten.normalizedQuery;
  const length = query.length;

  const symbolLookup = createScore('symbol_lookup');
  const narrative = createScore('narrative_analysis');
  const compare = createScore('compare_sources');
  const followUp = createScore('follow_up');

  if (rewritten.dreamSymbols.length > 0) {
    symbolLookup.score += 0.28;
    symbolLookup.reasons.push('explicit dream symbols detected');
  }
  if (rewritten.dreamSymbols.length <= 2 && length < 40) {
    symbolLookup.score += 0.22;
    symbolLookup.reasons.push('short symbol-oriented query');
  }
  if (hasMarker(query, SYMBOL_LOOKUP_PATTERNS)) {
    symbolLookup.score += 0.25;
    symbolLookup.reasons.push('contains meaning lookup markers');
  }

  if (length >= 40) {
    narrative.score += 0.24;
    narrative.reasons.push('long narrative query');
  }
  if (rewritten.dreamSymbols.length >= 2) {
    narrative.score += 0.22;
    narrative.reasons.push('multiple dream symbols detected');
  }
  if (rewritten.emotions.length > 0) {
    narrative.score += 0.16;
    narrative.reasons.push('emotional context detected');
  }
  if (/[，。,;；]/.test(normalized)) {
    narrative.score += 0.08;
    narrative.reasons.push('multi-clause narrative structure');
  }

  if (
    hasMarker(query, COMPARE_MARKERS_ZH) ||
    hasMarker(query, COMPARE_MARKERS_EN)
  ) {
    compare.score += 0.35;
    compare.reasons.push('contains comparison markers');
  }
  if (rewritten.sourceHints.length > 0) {
    compare.score += 0.24;
    compare.reasons.push('contains source perspective hints');
  }

  if (
    hasMarker(query, FOLLOW_UP_MARKERS_ZH) ||
    hasMarker(query, FOLLOW_UP_MARKERS_EN)
  ) {
    followUp.score += 0.4;
    followUp.reasons.push('contains follow-up markers');
  }
  if (length < 20 && rewritten.dreamSymbols.length === 0) {
    followUp.score += 0.08;
    followUp.reasons.push('short context-dependent query');
  }

  const ranked = rankScores([symbolLookup, narrative, compare, followUp]);
  const primary = ranked[0];
  const secondary = ranked[1];

  return {
    primary: primary.intent,
    secondary:
      secondary.score >= Math.max(primary.score - 0.12, 0.25)
        ? secondary.intent
        : undefined,
    scores: ranked,
    needsHistory: primary.intent === 'follow_up',
    needsLexicalBoost:
      primary.intent === 'symbol_lookup' ||
      primary.intent === 'compare_sources',
    needsSourceDiversity:
      primary.intent === 'compare_sources' ||
      primary.intent === 'narrative_analysis',
  };
}
