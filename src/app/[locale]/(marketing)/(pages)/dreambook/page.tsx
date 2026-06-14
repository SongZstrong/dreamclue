import { DreambookExplorer } from '@/components/dreambook/dreambook-explorer-new';
import { constructMetadata } from '@/lib/metadata';
import { Routes } from '@/routes';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata | undefined> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  const pt = await getTranslations({ locale, namespace: 'DreambookPage' });

  return constructMetadata({
    title: `${pt('title')} | ${t('title')}`,
    description: pt('description'),
    locale,
    pathname: Routes.Dreambook,
  });
}

export default function DreambookPage() {
  return <DreambookExplorer />;
}
