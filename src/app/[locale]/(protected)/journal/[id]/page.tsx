'use client';

import { DreamDetailCard } from '@/components/journal/dream-detail-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDream } from '@/hooks/use-journal';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

export default function DreamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: dream, isLoading, error } = useDream(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/journal">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dreams
          </Link>
        </Button>
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error || !dream) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/journal">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dreams
          </Link>
        </Button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Dream not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/journal">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dreams
        </Link>
      </Button>
      <DreamDetailCard dream={dream} />
    </div>
  );
}
