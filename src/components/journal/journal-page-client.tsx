'use client';

import { useDreams } from '@/hooks/use-journal';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { CreateDreamForm } from './create-dream-form';
import { JournalTable } from './journal-table';

export function JournalPageClient() {
  const [params, setParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    pageSize: parseAsInteger.withDefault(10),
    search: parseAsString.withDefault(''),
    mood: parseAsString.withDefault(''),
  });

  const { data, isLoading } = useDreams({
    page: params.page,
    pageSize: params.pageSize,
    search: params.search || undefined,
    mood: params.mood || undefined,
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Create Dream Form */}
      <CreateDreamForm />

      {/* Dreams Table */}
      <JournalTable
        dreams={data?.dreams || []}
        total={data?.total || 0}
        page={params.page}
        pageSize={params.pageSize}
        search={params.search}
        mood={params.mood}
        isLoading={isLoading}
        onPageChange={(page) => setParams({ page })}
        onPageSizeChange={(pageSize) => setParams({ pageSize, page: 1 })}
        onSearchChange={(search) => setParams({ search, page: 1 })}
        onMoodChange={(mood) => setParams({ mood, page: 1 })}
      />
    </div>
  );
}
