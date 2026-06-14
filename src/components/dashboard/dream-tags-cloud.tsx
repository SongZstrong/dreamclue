'use client';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDreamTags } from '@/hooks/use-dream-stats';
import { TagIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function DreamTagsCloud() {
  const t = useTranslations('Dashboard.dreamStats');
  const { data, isLoading, error } = useDreamTags();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('tags')}</CardTitle>
          <CardDescription>{t('tagsDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-8 w-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('tags')}</CardTitle>
          <CardDescription>{t('tagsDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            {t('error')}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.tags.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('tags')}</CardTitle>
          <CardDescription>{t('tagsDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <TagIcon className="size-8 opacity-50" />
            <p>{t('noTags')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate font sizes based on frequency
  const maxCount = Math.max(...data.tags.map((t) => t.count));
  const minCount = Math.min(...data.tags.map((t) => t.count));
  const range = maxCount - minCount || 1;

  const getTagSize = (count: number) => {
    const normalized = (count - minCount) / range;
    // Map to font sizes: base (sm) to 2xl
    if (normalized > 0.8) return 'text-2xl';
    if (normalized > 0.6) return 'text-xl';
    if (normalized > 0.4) return 'text-lg';
    if (normalized > 0.2) return 'text-base';
    return 'text-sm';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('tags')}</CardTitle>
        <CardDescription>{t('tagsDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {data.tags.map((tag) => (
            <Badge
              key={tag.tag}
              variant="secondary"
              className={`${getTagSize(tag.count)} cursor-default transition-all hover:scale-105`}
            >
              {tag.tag}
              <span className="ml-1.5 text-xs text-muted-foreground">
                {tag.count}
              </span>
            </Badge>
          ))}
        </div>
        {data.tags.length === 10 && (
          <p className="mt-4 text-xs text-muted-foreground">
            {t('showingTop10')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
