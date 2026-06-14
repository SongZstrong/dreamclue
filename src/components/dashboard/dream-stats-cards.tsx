'use client';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDreamStats } from '@/hooks/use-dream-stats';
import {
  BrainIcon,
  MoonIcon,
  SparklesIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

export function DreamStatsCards() {
  const t = useTranslations('Dashboard.dreamStats');
  const { data: stats, isLoading, error } = useDreamStats();

  if (isLoading) {
    return (
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="@container/card">
            <CardHeader>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="px-4 lg:px-6">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {t('error')}
        </div>
      </div>
    );
  }

  const { total, thisWeek, thisMonth, analyzed, analysisRate, monthChange } =
    stats;

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* Total Dreams */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{t('totalDreams')}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {total}
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className="border-transparent bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
            >
              <MoonIcon className="size-3" />
              {t('allTime')}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {thisWeek > 0
              ? `+${thisWeek} ${t('thisWeek')}`
              : t('noNewThisWeek')}
          </div>
          <div className="text-muted-foreground">{t('totalDescription')}</div>
        </CardFooter>
      </Card>

      {/* This Month */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{t('thisMonth')}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {thisMonth}
          </CardTitle>
          <CardAction>
            {monthChange !== 0 && (
              <Badge
                variant="outline"
                className={
                  monthChange > 0
                    ? 'border-transparent bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                    : 'border-transparent bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                }
              >
                {monthChange > 0 ? (
                  <TrendingUpIcon className="size-3" />
                ) : (
                  <TrendingDownIcon className="size-3" />
                )}
                {monthChange > 0 ? '+' : ''}
                {monthChange}%
              </Badge>
            )}
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {monthChange > 0 ? (
              <>
                {t('trending')} <TrendingUpIcon className="size-4" />
              </>
            ) : monthChange < 0 ? (
              <>
                {t('declining')} <TrendingDownIcon className="size-4" />
              </>
            ) : (
              t('stable')
            )}
          </div>
          <div className="text-muted-foreground">{t('monthDescription')}</div>
        </CardFooter>
      </Card>

      {/* AI Analyzed */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{t('analyzed')}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {analyzed}
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className="border-transparent bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400"
            >
              <BrainIcon className="size-3" />
              {analysisRate}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {t('analysisRate')}: {analysisRate}%
          </div>
          <div className="text-muted-foreground">
            {t('analyzedDescription')}
          </div>
        </CardFooter>
      </Card>

      {/* Dreams This Week */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{t('thisWeekTitle')}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {thisWeek}
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className="border-transparent bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
            >
              <SparklesIcon className="size-3" />
              {t('recent')}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {thisWeek > 0 ? t('activeRecording') : t('noRecordsYet')}
          </div>
          <div className="text-muted-foreground">{t('weekDescription')}</div>
        </CardFooter>
      </Card>
    </div>
  );
}
