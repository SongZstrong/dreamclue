'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { dreams } from '@/db/schema';
import { useAnalyzeDream } from '@/hooks/use-journal';
import {
  getKnowledgeDisclaimer,
  parseAnswerSections,
} from '@/lib/knowledge-base/public-report';
import { BrainCircuit } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

type Dream = typeof dreams.$inferSelect;

interface AIAnalysisSectionProps {
  dream: Dream;
}

export function AIAnalysisSection({ dream }: AIAnalysisSectionProps) {
  const t = useTranslations('Dreams');
  const locale = useLocale();
  const analyzeDream = useAnalyzeDream();
  const sections = dream.aiAnalysis
    ? parseAnswerSections(dream.aiAnalysis, locale).filter(
        (section) => section.key !== 'references'
      )
    : [];
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
  });

  const handleAnalyze = () => {
    analyzeDream.mutate({ id: dream.id, locale });
  };

  if (analyzeDream.isPending) {
    return (
      <div className="space-y-3 border-t pt-6">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 animate-pulse" />
          <h3 className="font-semibold">{t('analysis.title')}</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {t('analysis.analyzing')}
        </p>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!dream.aiAnalysis) {
    return (
      <div className="space-y-3 border-t pt-6">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-5 w-5" />
          <h3 className="font-semibold">{t('analysis.title')}</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {t('analysis.notAnalyzed')}
        </p>
        <Button onClick={handleAnalyze} variant="outline" size="sm">
          <BrainCircuit className="h-4 w-4 mr-2" />
          {t('form.analyze')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 border-t pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-5 w-5" />
          <h3 className="font-semibold">{t('analysis.title')}</h3>
        </div>
        <Button
          onClick={handleAnalyze}
          variant="ghost"
          size="sm"
          disabled={analyzeDream.isPending}
        >
          {t('analysis.reanalyze')}
        </Button>
      </div>
      {dream.aiAnalyzedAt && (
        <p className="text-xs text-muted-foreground">
          {t('analysis.analyzedOn', {
            date: dateFormatter.format(new Date(dream.aiAnalyzedAt)),
          })}
        </p>
      )}
      <div className="space-y-4">
        {sections.length > 0 ? (
          sections.map((section) => (
            <section key={section.key} className="space-y-2">
              <h4 className="text-sm font-medium">{section.title}</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                {section.content
                  .split('\n')
                  .map((paragraph, index) =>
                    paragraph.trim() ? (
                      <p key={`${section.key}-${index}`}>{paragraph.trim()}</p>
                    ) : null
                  )}
              </div>
            </section>
          ))
        ) : (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {dream.aiAnalysis}
          </p>
        )}
        <p className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          {getKnowledgeDisclaimer(locale)}
        </p>
      </div>
    </div>
  );
}
