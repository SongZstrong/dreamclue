import { HeaderSection } from '@/components/layout/header-section';
import { ScrollReveal } from '@/components/shared/scroll-reveal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LocaleLink } from '@/i18n/navigation';
import {
  BookOpenIcon,
  BrainIcon,
  ChartLineIcon,
  ChevronRight,
  MoonIcon,
  SearchIcon,
  ShieldCheckIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type * as React from 'react';

export default function IntegrationSection() {
  const t = useTranslations('HomePage.integration');
  const items = [
    {
      key: 'item-1',
      icon: MoonIcon,
      title: 'items.item-1.title',
      description: 'items.item-1.description',
    },
    {
      key: 'item-2',
      icon: SearchIcon,
      title: 'items.item-2.title',
      description: 'items.item-2.description',
    },
    {
      key: 'item-3',
      icon: BrainIcon,
      title: 'items.item-3.title',
      description: 'items.item-3.description',
    },
    {
      key: 'item-4',
      icon: BookOpenIcon,
      title: 'items.item-4.title',
      description: 'items.item-4.description',
    },
    {
      key: 'item-5',
      icon: ChartLineIcon,
      title: 'items.item-5.title',
      description: 'items.item-5.description',
    },
    {
      key: 'item-6',
      icon: ShieldCheckIcon,
      title: 'items.item-6.title',
      description: 'items.item-6.description',
    },
  ] as const;

  return (
    <section id="integration" className="px-4 py-16 md:py-24">
      <div className="mx-auto max-w-5xl">
        <ScrollReveal>
          <HeaderSection
            title={t('title')}
            subtitle={t('subtitle')}
            description={t('description')}
          />
        </ScrollReveal>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <ScrollReveal key={item.key} delay={index * 80}>
                <IntegrationCard
                  title={t(item.title)}
                  description={t(item.description)}
                >
                  <Icon className="text-primary" />
                </IntegrationCard>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const IntegrationCard = ({
  title,
  description,
  children,
  link = '/dreambook',
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  link?: string;
}) => {
  const t = useTranslations('HomePage.integration');

  return (
    <Card className="bg-transparent p-6 transition-colors duration-200 hover:bg-accent dark:hover:bg-card">
      <div className="relative">
        <div className="*:size-10">{children}</div>

        <div className="space-y-2 py-6">
          <h3 className="text-base font-medium">{title}</h3>
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {description}
          </p>
        </div>

        <div className="flex gap-3 border-t border-dashed pt-6">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="gap-1 pr-2 shadow-none"
          >
            <LocaleLink href={link}>
              {t('learnMore')}
              <ChevronRight className="ml-0 size-3.5! opacity-50" />
            </LocaleLink>
          </Button>
        </div>
      </div>
    </Card>
  );
};
