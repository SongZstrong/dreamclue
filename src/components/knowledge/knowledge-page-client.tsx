'use client';

import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useKnowledgeFiles,
  useDeleteKnowledgeFile,
  useProcessKnowledgeFile,
} from '@/hooks/use-knowledge-base';
import {
  PlusIcon,
  SearchIcon,
  Loader2Icon,
  TrashIcon,
  RefreshCwIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { UploadFileDialog } from './upload-file-dialog-simple';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export function KnowledgePageClient() {
  const t = useTranslations('KnowledgeBase');
  const [search, setSearch] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useKnowledgeFiles(page, 10, search);
  const deleteMutation = useDeleteKnowledgeFile();
  const processMutation = useProcessKnowledgeFile();

  const breadcrumbs = [{ label: t('title'), isCurrentPage: true }];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: 'secondary',
      processing: 'default',
      completed: 'default',
      failed: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {t(`status.${status}` as any)}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <DashboardHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col p-4 lg:p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            {t('upload')}
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('fileName')}</TableHead>
                <TableHead>{t('fileTitle')}</TableHead>
                <TableHead>{t('fileType')}</TableHead>
                <TableHead>{t('fileSize')}</TableHead>
                <TableHead>{t('fileStatus')}</TableHead>
                <TableHead>{t('chunkCount')}</TableHead>
                <TableHead>{t('uploadTime')}</TableHead>
                <TableHead>{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    <Loader2Icon className="mx-auto h-6 w-6 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : data?.files.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground"
                  >
                    {t('noFiles')}
                  </TableCell>
                </TableRow>
              ) : (
                data?.files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="font-medium">
                      {file.fileName}
                    </TableCell>
                    <TableCell>{file.title}</TableCell>
                    <TableCell className="uppercase">{file.fileType}</TableCell>
                    <TableCell>{formatFileSize(file.fileSize)}</TableCell>
                    <TableCell>{getStatusBadge(file.status)}</TableCell>
                    <TableCell>{file.chunkCount || '-'}</TableCell>
                    <TableCell>
                      {format(new Date(file.createdAt), 'yyyy-MM-dd HH:mm')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {file.status !== 'processing' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => processMutation.mutate(file.id)}
                            disabled={processMutation.isPending}
                          >
                            <RefreshCwIcon className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm(t('deleteConfirm'))) {
                              deleteMutation.mutate(file.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <TrashIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {t('showing', {
                start: (page - 1) * 10 + 1,
                end: Math.min(page * 10, data.total),
                total: data.total,
              })}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                {t('previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
              >
                {t('next')}
              </Button>
            </div>
          </div>
        )}
      </div>

      <UploadFileDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onSuccess={() => {
          setUploadDialogOpen(false);
          refetch();
        }}
      />
    </>
  );
}
