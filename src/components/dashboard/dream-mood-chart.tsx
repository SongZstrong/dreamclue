'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { useDreamMoodDistribution } from '@/hooks/use-dream-stats';
import { useTranslations } from 'next-intl';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

const chartConfig = {
  count: {
    label: 'Dreams',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export function DreamMoodChart() {
  const t = useTranslations('Dashboard.dreamStats');
  const tMoods = useTranslations('Dreams.moods');
  const { data, isLoading, error } = useDreamMoodDistribution();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('moodDistribution')}</CardTitle>
          <CardDescription>{t('moodDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('moodDistribution')}</CardTitle>
          <CardDescription>{t('moodDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            {t('error')}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('moodDistribution')}</CardTitle>
          <CardDescription>{t('moodDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            {t('noData')}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data with translated mood names
  const chartData = data.distribution.map((item) => ({
    mood:
      item.mood === 'unspecified' ? t('unspecified') : tMoods(item.mood as any),
    count: item.count,
    percentage: item.percentage,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('moodDistribution')}</CardTitle>
        <CardDescription>{t('moodDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="mood"
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 12 }}
            />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name, props) => (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{value}</span>
                      <span className="text-muted-foreground">
                        ({props.payload.percentage}%)
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
