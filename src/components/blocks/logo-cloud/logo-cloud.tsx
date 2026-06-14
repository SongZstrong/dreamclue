import { ScrollReveal } from '@/components/shared/scroll-reveal';
import {
  BookOpenIcon,
  BrainIcon,
  ChartLineIcon,
  MoonIcon,
  SearchIcon,
  ShieldCheckIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function LogoCloudSection() {
  const t = useTranslations('HomePage.logocloud');
  const items = [
    { label: t('items.symbols'), icon: BookOpenIcon },
    { label: t('items.journal'), icon: MoonIcon },
    { label: t('items.analysis'), icon: BrainIcon },
    { label: t('items.privacy'), icon: ShieldCheckIcon },
    { label: t('items.search'), icon: SearchIcon },
    { label: t('items.patterns'), icon: ChartLineIcon },
  ];

  return (
    <section
      id="logo-cloud"
      className="relative overflow-hidden px-4 py-16 md:py-24"
    >
      <div className="absolute inset-0 bg-linear-to-b from-muted/60 to-transparent" />
      <div className="relative mx-auto max-w-5xl px-6">
        <ScrollReveal>
          <h2 className="text-center text-xl font-medium">{t('title')}</h2>
        </ScrollReveal>

        <ScrollReveal
          delay={150}
          className="mx-auto mt-12 flex max-w-4xl flex-wrap items-center justify-center gap-3"
        >
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="inline-flex items-center gap-2 rounded-md border bg-background/80 px-4 py-2 text-sm text-muted-foreground shadow-xs"
              >
                <Icon className="size-4 text-primary" />
                <span>{item.label}</span>
              </div>
            );
          })}
        </ScrollReveal>
      </div>
    </section>
  );
}
