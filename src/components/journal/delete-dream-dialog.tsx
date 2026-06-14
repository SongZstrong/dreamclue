'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeleteDream } from '@/hooks/use-journal';
import { useTranslations } from 'next-intl';

interface DeleteDreamDialogProps {
  dreamId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void | Promise<void>;
}

export function DeleteDreamDialog({
  dreamId,
  open,
  onOpenChange,
  onDeleted,
}: DeleteDreamDialogProps) {
  const t = useTranslations('Dreams');
  const deleteDream = useDeleteDream();

  const handleDelete = async () => {
    await deleteDream.mutateAsync(dreamId);
    onOpenChange(false);
    await onDeleted?.();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('delete.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('delete.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('delete.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteDream.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteDream.isPending ? t('delete.deleting') : t('delete.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
