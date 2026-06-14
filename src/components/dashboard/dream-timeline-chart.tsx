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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDreamTimeline } from '@/hooks/use-dream-stats';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

const chartConfig = {
  count: {
    label: 'Dreams',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export function DreamTimelineChart() {
  const t = useTranslations('Dashboard.dreamStats');
  const [range, setRange] = useState<'7' | '30' | '90'>('7');
  const { data, isLoading, error } = useDreamTimeline(range);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>{t('timeline')}</CardTitle>
            <CardDescription>{t('timelineDescription')}</CardDescription>
          </div>
          <Skeleton className="h-10 w-[120px]" />
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
          <CardTitle>{t('timeline')}</CardTitle>
          <CardDescription>{t('timelineDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            {t('error')}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format dates for display
  const chartData = data.timeline.map((item) => ({
    date: format(new Date(item.date), 'MMM dd'),
    fullDate: item.date,
    count: item.count,
  }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>{t('timeline')}</CardTitle>
          <CardDescription>{t('timelineDescription')}</CardDescription>
        </div>
        <Select value={range} onValueChange={(v) => setRange(v as any)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">{t('last7Days')}</SelectItem>
            <SelectItem value="30">{t('last30Days')}</SelectItem>
            <SelectItem value="90">{t('last90Days')}</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id="fillCount" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-count)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-count)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 12 }}
              allowDecimals={false}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value, payload) => {
                    if (payload?.[0]) {
                      return format(
                        new Date(payload[0].payload.fullDate),
                        'PPP'
                      );
                    }
                    return value;
                  }}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="var(--color-count)"
              fill="url(#fillCount)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
