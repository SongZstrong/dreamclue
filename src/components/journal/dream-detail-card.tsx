'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { dreams } from '@/db/schema';
import { Edit, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { AIAnalysisSection } from './ai-analysis-section';
import { DeleteDreamDialog } from './delete-dream-dialog';
import { EditDreamDialog } from './edit-dream-dialog';

type Dream = typeof dreams.$inferSelect;

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

interface DreamDetailCardProps {
  dream: Dream;
  onDeleted?: () => void | Promise<void>;
}

export function DreamDetailCard({ dream, onDeleted }: DreamDetailCardProps) {
  const t = useTranslations('Dreams');
  const locale = useLocale();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const longDateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: 'long',
  });
  const mediumDateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
  });

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <CardTitle className="text-2xl">{dream.title}</CardTitle>
              <CardDescription>
                {longDateFormatter.format(new Date(dream.createdAt))}
                {dream.updatedAt &&
                  dream.updatedAt.getTime() !== dream.createdAt.getTime() && (
                    <span className="ml-2 text-xs">
                      (
                      {t('detail.updated', {
                        date: mediumDateFormatter.format(
                          new Date(dream.updatedAt)
                        ),
                      })}
                      )
                    </span>
                  )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsDeleting(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Mood and Tags */}
          <div className="flex flex-wrap gap-2 pt-2">
            {dream.mood && (
              <Badge
                variant="secondary"
                className={MOOD_COLORS[dream.mood] || ''}
              >
                {t(`moods.${dream.mood}` as any)}
              </Badge>
            )}
            {dream.tags?.map((tag, i) => (
              <Badge key={i} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Dream Content */}
          <div>
            <h3 className="font-semibold mb-2">{t('form.content')}</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {dream.content}
            </p>
          </div>

          {/* AI Analysis Section */}
          <AIAnalysisSection dream={dream} />
        </CardContent>
      </Card>

      {/* Dialogs */}
      {isEditing && (
        <EditDreamDialog
          dream={dream}
          open={isEditing}
          onOpenChange={setIsEditing}
        />
      )}
      {isDeleting && (
        <DeleteDreamDialog
          dreamId={dream.id}
          open={isDeleting}
          onOpenChange={setIsDeleting}
          onDeleted={onDeleted}
        />
      )}
    </>
  );
}
