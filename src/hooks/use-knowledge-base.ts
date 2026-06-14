'use client';

import {
  uploadKnowledgeFileAction,
  getKnowledgeFilesAction,
  deleteKnowledgeFileAction,
  searchKnowledgeAction,
} from '@/actions';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Query keys
export const knowledgeKeys = {
  all: ['knowledge'] as const,
  lists: () => [...knowledgeKeys.all, 'list'] as const,
  list: (filters: any) => [...knowledgeKeys.lists(), filters] as const,
  search: (query: string) => [...knowledgeKeys.all, 'search', query] as const,
};

// Get knowledge files list
export function useKnowledgeFiles(
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  status?: string
) {
  return useQuery({
    queryKey: knowledgeKeys.list({ page, pageSize, search, status }),
    queryFn: async () => {
      const result = await getKnowledgeFilesAction({
        page,
        pageSize,
        search,
        status,
      });

      if (!result?.data?.success) {
        throw new Error(result?.data?.error || 'Failed to get files');
      }

      return result.data.data;
    },
  });
}

// Upload knowledge file
export function useUploadKnowledgeFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      fileId: string;
      fileName: string;
      fileType: string;
      fileSize: number;
      filePath: string;
      title?: string;
      author?: string;
      description?: string;
    }) => {
      console.log('🔍 Calling uploadKnowledgeFileAction with:', data);
      const result = await uploadKnowledgeFileAction(data);
      console.log('📦 Action result:', JSON.stringify(result, null, 2));

      // Check if action succeeded
      if (!result?.data) {
        console.error('❌ No data in result:', result);
        throw new Error('No data returned from action');
      }

      if (!result.data.success) {
        throw new Error('Failed to upload file');
      }

      const file = result.data.data;
      if (!file) {
        throw new Error('Failed to upload file');
      }

      console.log('✅ Upload successful:', file);
      return file;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.lists() });
      toast.success('File uploaded successfully');
    },
    onError: (error: Error) => {
      console.error('❌ Upload mutation error:', error);
      toast.error(error.message || 'Failed to upload file');
    },
  });
}

// Process knowledge file
export function useProcessKnowledgeFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fileId: string) => {
      const response = await fetch('/api/knowledge/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      });

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Failed to process file');
      }

      const processed = result.data;
      if (!processed) {
        throw new Error('Failed to process file');
      }

      return processed;
    },
    onSuccess: (result: { started?: boolean }) => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.lists() });
      toast.success(
        result.started === false
          ? 'File is already processing'
          : 'File processing started'
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to process file');
    },
  });
}

// Delete knowledge file
export function useDeleteKnowledgeFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fileId: string) => {
      const result = await deleteKnowledgeFileAction({ fileId });

      if (!result?.data?.success) {
        throw new Error(result?.data?.error || 'Failed to delete file');
      }

      const deleted = result.data.data;
      if (!deleted) {
        throw new Error('Failed to delete file');
      }

      return deleted;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.lists() });
      toast.success('File deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete file');
    },
  });
}

// Search knowledge
export function useSearchKnowledge(query: string, topK: number = 10) {
  return useQuery({
    queryKey: knowledgeKeys.search(query),
    queryFn: async () => {
      const result = await searchKnowledgeAction({ query, topK });

      if (!result?.data?.success) {
        throw new Error(result?.data?.error || 'Failed to search');
      }

      const searchData = result.data.data;
      if (!searchData) {
        throw new Error('Failed to search');
      }

      return searchData;
    },
    enabled: !!query && query.length > 0,
  });
}
