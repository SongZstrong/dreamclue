import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { KnowledgePageClient } from '@/components/knowledge/knowledge-page-client';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function KnowledgePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect('/auth/sign-in');
  }

  // Only admin can access
  if (session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  return <KnowledgePageClient />;
}
