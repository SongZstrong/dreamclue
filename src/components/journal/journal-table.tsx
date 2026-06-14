'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { dreams } from '@/db/schema';
import { LocaleLink } from '@/i18n/navigation';
import { Routes } from '@/routes';
import { Edit, Eye, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { DeleteDreamDialog } from './delete-dream-dialog';
import { EditDreamDialog } from './edit-dream-dialog';

type Dream = typeof dreams.$inferSelect;

interface DreamsTableProps {
  dreams: Dream[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  mood: string;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSearchChange: (search: string) => void;
  onMoodChange: (mood: string) => void;
}

const MOODS = [
  'happy',
  'sad',
  'anxious',
  'peaceful',
  'confused',
  'excited',
  'scared',
  'neutral',
];

const MOOD_COLORS: Record<string, string> = {
  happy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  sad: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  anxious:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  peaceful:
    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  confused: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  excited:
    'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  scared: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  neutral: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300',
};

const ALL_MOODS = 'all';

export function JournalTable({
  dreams,
  total,
  page,
  pageSize,
  search,
  mood,
  isLoading,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  onMoodChange,
}: DreamsTableProps) {
  const t = useTranslations('Dreams');
  const locale = useLocale();
  const [editingDream, setEditingDream] = useState<Dream | null>(null);
  const [deletingDreamId, setDeletingDreamId] = useState<string | null>(null);

  const totalPages = Math.ceil(total / pageSize);
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder={t('list.search')}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select
          value={mood || ALL_MOODS}
          onValueChange={(value) =>
            onMoodChange(value === ALL_MOODS ? '' : value)
          }
        >
          <SelectTrigger className="sm:w-[180px]">
            <SelectValue placeholder={t('list.filterByMood')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_MOODS}>{t('list.allMoods')}</SelectItem>
            {MOODS.map((m) => (
              <SelectItem key={m} value={m}>
                {t(`moods.${m}` as any)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('form.title')}</TableHead>
              <TableHead>{t('form.mood')}</TableHead>
              <TableHead>{t('form.tags')}</TableHead>
              <TableHead>{t('list.date')}</TableHead>
              <TableHead className="text-right">{t('list.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  {t('list.loading')}
                </TableCell>
              </TableRow>
            ) : dreams.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  {t('list.empty')}
                </TableCell>
              </TableRow>
            ) : (
              dreams.map((dream) => (
                <TableRow key={dream.id}>
                  <TableCell className="font-medium">{dream.title}</TableCell>
                  <TableCell>
                    {dream.mood && (
                      <Badge
                        variant="secondary"
                        className={MOOD_COLORS[dream.mood] || ''}
                      >
                        {t(`moods.${dream.mood}` as any)}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {dream.tags && dream.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {dream.tags.slice(0, 3).map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {dream.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{dream.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {dateFormatter.format(new Date(dream.createdAt))}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <LocaleLink href={`${Routes.Journal}/${dream.id}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">{t('actions.view')}</span>
                        </LocaleLink>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingDream(dream)}
                        aria-label={t('actions.edit')}
                        title={t('actions.edit')}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingDreamId(dream.id)}
                        aria-label={t('actions.delete')}
                        title={t('actions.delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {t('list.pagination', {
              from: (page - 1) * pageSize + 1,
              to: Math.min(page * pageSize, total),
              total,
            })}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
            >
              {t('list.previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
            >
              {t('list.next')}
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      {editingDream && (
        <EditDreamDialog
          dream={editingDream}
          open={!!editingDream}
          onOpenChange={(open) => !open && setEditingDream(null)}
        />
      )}
      {deletingDreamId && (
        <DeleteDreamDialog
          dreamId={deletingDreamId}
          open={!!deletingDreamId}
          onOpenChange={(open) => !open && setDeletingDreamId(null)}
        />
      )}
    </div>
  );
}
