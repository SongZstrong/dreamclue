import type { ApiKey } from '@/db/types';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

// Query keys
export const apiKeysKeys = {
  all: ['apikeys'] as const,
  lists: () => [...apiKeysKeys.all, 'lists'] as const,
  list: (params: { pageIndex: number; pageSize: number }) =>
    [...apiKeysKeys.lists(), params] as const,
};

// Hook to fetch API keys with pagination
export function useApiKeys(pageIndex: number, pageSize: number) {
  return useQuery({
    queryKey: apiKeysKeys.list({ pageIndex, pageSize }),
    queryFn: async () => {
      const response = await fetch(
        `/api/apikeys?page=${pageIndex}&pageSize=${pageSize}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch API keys');
      }

      return response.json();
    },
    placeholderData: keepPreviousData,
  });
}

// Hook to create a new API key
export function useCreateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const response = await fetch('/api/apikeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error('Failed to create API key');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeysKeys.lists() });
    },
  });
}

// Hook to delete an API key
export function useDeleteApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keyId: string) => {
      const response = await fetch(`/api/apikeys/${keyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete API key');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeysKeys.lists() });
    },
  });
}
