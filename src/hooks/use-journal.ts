'use client';

import {
  analyzeDreamAction,
  createDreamAction,
  deleteDreamAction,
  getDreamAction,
  getDreamsAction,
  updateDreamAction,
} from '@/actions';
import type { dreams } from '@/db/schema';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

// Types
type Dream = typeof dreams.$inferSelect;

interface GetDreamsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  mood?: string;
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

interface CreateDreamParams {
  title: string;
  content: string;
  mood?: string;
  tags?: string[];
}

interface UpdateDreamParams {
  id: string;
  title: string;
  content: string;
  mood?: string;
  tags?: string[];
}

interface AnalyzeDreamParams {
  id: string;
  locale?: string;
}

// Query keys factory
export const dreamsKeys = {
  all: ['dreams'] as const,
  lists: () => [...dreamsKeys.all, 'list'] as const,
  list: (params: GetDreamsParams) => [...dreamsKeys.lists(), params] as const,
  details: () => [...dreamsKeys.all, 'detail'] as const,
  detail: (id: string) => [...dreamsKeys.details(), id] as const,
};

/**
 * Hook to fetch paginated dreams list
 */
export function useDreams(params: GetDreamsParams = {}) {
  return useQuery({
    queryKey: dreamsKeys.list(params),
    queryFn: async () => {
      const result = await getDreamsAction({
        page: params.page || 1,
        pageSize: params.pageSize || 10,
        search: params.search,
        mood: params.mood,
        sortBy: params.sortBy || 'createdAt',
        sortOrder: params.sortOrder || 'desc',
      });

      if (!result?.data?.success) {
        throw new Error(result?.data?.error || 'Failed to fetch dreams');
      }

      return result.data.data;
    },
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch a single dream by ID
 */
export function useDream(
  id: string | undefined,
  options?: Omit<UseQueryOptions<Dream>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: dreamsKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Dream ID is required');

      const result = await getDreamAction({ id });

      if (!result?.data?.success) {
        throw new Error(result?.data?.error || 'Failed to fetch dream');
      }

      const dream = result.data.data;
      if (!dream) {
        throw new Error('Dream not found');
      }

      return dream;
    },
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to create a new dream
 */
export function useCreateDream() {
  const queryClient = useQueryClient();
  const t = useTranslations('Dreams.messages');

  return useMutation({
    mutationFn: async (params: CreateDreamParams) => {
      const result = await createDreamAction(params);

      if (!result?.data?.success) {
        throw new Error(result?.data?.error || 'Failed to create dream');
      }

      const dream = result.data.data;
      if (!dream) {
        throw new Error('Failed to create dream');
      }

      return dream;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dreamsKeys.lists() });
      toast.success(t('createSuccess'));
    },
    onError: (error: Error) => {
      toast.error(error.message || t('error'));
    },
  });
}

/**
 * Hook to update an existing dream
 */
export function useUpdateDream() {
  const queryClient = useQueryClient();
  const t = useTranslations('Dreams.messages');

  return useMutation({
    mutationFn: async (params: UpdateDreamParams) => {
      const result = await updateDreamAction(params);

      if (!result?.data?.success) {
        throw new Error(result?.data?.error || 'Failed to update dream');
      }

      const dream = result.data.data;
      if (!dream) {
        throw new Error('Failed to update dream');
      }

      return dream;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: dreamsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dreamsKeys.detail(data.id) });
      toast.success(t('updateSuccess'));
    },
    onError: (error: Error) => {
      toast.error(error.message || t('error'));
    },
  });
}

/**
 * Hook to delete a dream
 */
export function useDeleteDream() {
  const queryClient = useQueryClient();
  const t = useTranslations('Dreams.messages');

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteDreamAction({ id });

      if (!result?.data?.success) {
        throw new Error(result?.data?.error || 'Failed to delete dream');
      }

      const deleted = result.data.data;
      if (!deleted) {
        throw new Error('Failed to delete dream');
      }

      return deleted;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: dreamsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dreamsKeys.details() });
      queryClient.removeQueries({ queryKey: dreamsKeys.detail(data.id) });
      toast.success(t('deleteSuccess'));
    },
    onError: (error: Error) => {
      toast.error(error.message || t('error'));
    },
  });
}

/**
 * Hook to analyze a dream with AI
 */
export function useAnalyzeDream() {
  const queryClient = useQueryClient();
  const t = useTranslations('Dreams.messages');

  return useMutation({
    mutationFn: async (params: string | AnalyzeDreamParams) => {
      const input = typeof params === 'string' ? { id: params } : params;
      const result = await analyzeDreamAction(input);

      if (!result?.data?.success) {
        throw new Error(result?.data?.error || 'Failed to analyze dream');
      }

      const analysis = result.data.data;
      if (!analysis) {
        throw new Error('Failed to analyze dream');
      }

      return analysis;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: dreamsKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: dreamsKeys.detail(data.dream.id),
      });
      toast.success(t('analyzeSuccess'));
    },
    onError: (error: Error) => {
      toast.error(error.message || t('error'));
    },
  });
}
