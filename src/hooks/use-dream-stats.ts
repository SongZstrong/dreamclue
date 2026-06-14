'use client';

import {
  getDreamMoodDistributionAction,
  getDreamStatsAction,
  getDreamTagsAction,
  getDreamTimelineAction,
} from '@/actions';
import { useQuery } from '@tanstack/react-query';

export function useDreamStats() {
  return useQuery({
    queryKey: ['dream-stats'],
    queryFn: async () => {
      const result = await getDreamStatsAction();
      if (!result?.data?.success) {
        throw new Error(result?.data?.error || 'Failed to get dream stats');
      }
      return result.data.data;
    },
  });
}

export function useDreamMoodDistribution() {
  return useQuery({
    queryKey: ['dream-mood-distribution'],
    queryFn: async () => {
      const result = await getDreamMoodDistributionAction();
      if (!result?.data?.success) {
        throw new Error(
          result?.data?.error || 'Failed to get mood distribution'
        );
      }
      return result.data.data;
    },
  });
}

export function useDreamTimeline(range: '7' | '30' | '90' = '7') {
  return useQuery({
    queryKey: ['dream-timeline', range],
    queryFn: async () => {
      const result = await getDreamTimelineAction({ range });
      if (!result?.data?.success) {
        throw new Error(result?.data?.error || 'Failed to get timeline');
      }
      return result.data.data;
    },
  });
}

export function useDreamTags() {
  return useQuery({
    queryKey: ['dream-tags'],
    queryFn: async () => {
      const result = await getDreamTagsAction();
      if (!result?.data?.success) {
        throw new Error(result?.data?.error || 'Failed to get tags');
      }
      return result.data.data;
    },
  });
}
