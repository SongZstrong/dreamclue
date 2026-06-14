import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DreamStatsCards } from '@/components/dashboard/dream-stats-cards';
import { DreamTimelineChart } from '@/components/dashboard/dream-timeline-chart';
import { DreamMoodChart } from '@/components/dashboard/dream-mood-chart';
import { DreamTagsCloud } from '@/components/dashboard/dream-tags-cloud';
import { useTranslations } from 'next-intl';

/**
 * Dashboard page - Dream Statistics
 *
 * Displays real-time statistics about user's dream journal:
 * - Total dreams, monthly trends, AI analysis stats
 * - Mood distribution chart
 * - Timeline chart showing recording trends
 * - Popular tags cloud
 */
export default function DashboardPage() {
  const t = useTranslations();

  const breadcrumbs = [
    {
      label: t('Dashboard.dashboard.title'),
      isCurrentPage: true,
    },
  ];

  return (
    <>
      <DashboardHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            {/* Statistics Cards */}
            <DreamStatsCards />

            {/* Timeline Chart */}
            <div className="px-4 lg:px-6">
              <DreamTimelineChart />
            </div>

            {/* Mood Chart and Tags Cloud */}
            <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2 lg:px-6">
              <DreamMoodChart />
              <DreamTagsCloud />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
