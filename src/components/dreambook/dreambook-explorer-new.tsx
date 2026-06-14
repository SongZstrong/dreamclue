'use client';

import { searchKnowledgeAction } from '@/actions';
import { LocaleLink } from '@/i18n/navigation';
import { Routes } from '@/routes';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import styles from './dreambook-explorer.module.css';

interface SearchResult {
  id: string;
  file_id: string;
  file_name: string;
  title: string;
  text: string;
  chunk_id: number;
  similarity: number;
  created_at: string;
  relevanceScore?: number;
}

interface AnswerCitation {
  id: string;
  title: string;
  fileName: string;
  chunkId: number;
  excerpt: string;
}

interface GeneratedAnswer {
  content: string;
  model: string;
  provider: 'bailian' | 'siliconflow';
  citations: AnswerCitation[];
}

interface UsageInfo {
  dailyCount: number;
  dailyLimit: number;
  remaining: number;
}

function IconBase({
  className,
  children,
}: React.SVGProps<SVGSVGElement> & {
  children: React.ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function MoonIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </IconBase>
  );
}

function StarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </IconBase>
  );
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </IconBase>
  );
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </IconBase>
  );
}

export function DreambookExplorer() {
  const t = useTranslations('DreambookPage');
  const locale = useLocale();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<GeneratedAnswer | null>(null);
  const [answerWarning, setAnswerWarning] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [signInRequired, setSignInRequired] = useState(false);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [usage, setUsage] = useState<UsageInfo | null>(null);

  const performSearch = async (searchQuery = query) => {
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery || isLoading) {
      return;
    }

    setQuery(trimmedQuery);
    setHasSearched(true);
    setIsLoading(true);
    setResults([]);
    setAnswer(null);
    setAnswerWarning(null);
    setError(null);
    setLimitReached(false);
    setSignInRequired(false);
    setIsUnlimited(false);
    setUsage(null);

    try {
      const result = await searchKnowledgeAction({
        query: trimmedQuery,
        topK: 10,
        locale,
      });

      if (result?.data?.success && result.data.data) {
        setResults(result.data.data.results || []);
        setIsUnlimited(result.data.data.unlimited || false);
        setUsage(result.data.data.usage || null);
        setAnswer(result.data.data.answer || null);
        setAnswerWarning(result.data.data.answerWarning || null);
      } else {
        setError(result?.data?.error || 'Search failed');
        if (result?.data?.limitReached) {
          setLimitReached(true);
        }
        if (result?.data?.signInRequired) {
          setSignInRequired(true);
        }
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className={styles.page}>
      <div className={styles.background} aria-hidden="true">
        <div className={styles.gradientBg} />
        <div className={`${styles.orb} ${styles.orb1}`} />
        <div className={`${styles.orb} ${styles.orb2}`} />
      </div>

      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.brand}>
            <MoonIcon className={styles.iconMoon} />
            <h1 className={styles.title}>{t('title')}</h1>
            <StarIcon className={styles.iconStar} />
          </div>
          <p className={styles.subtitle}>{t('subtitle')}</p>
        </div>

        <div className={styles.searchContainer}>
          <div className={styles.searchGlow} />
          <form
            className={styles.searchBox}
            onSubmit={(event) => {
              event.preventDefault();
              performSearch();
            }}
          >
            <label htmlFor="dream-input" className={styles.searchLabel}>
              {t('searchLabel')}
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="dream-input"
                type="text"
                value={query}
                autoComplete="off"
                placeholder={t('placeholder')}
                className={styles.dreamInput}
                onChange={(event) => setQuery(event.target.value)}
              />
              <button
                type="submit"
                className={styles.searchButton}
                disabled={isLoading}
                aria-label={t('search')}
              >
                <SearchIcon className={styles.iconSearch} />
              </button>
            </div>
          </form>
          {!isUnlimited && hasSearched && !limitReached && usage && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
              {t('freeUsageHint', {
                count: usage.dailyCount,
                limit: usage.dailyLimit,
                remaining: usage.remaining,
              })}
            </p>
          )}
          {isUnlimited && hasSearched && (
            <p className="mt-2 text-sm text-green-600 dark:text-green-400 text-center">
              {t('unlimitedAccess')}
            </p>
          )}
        </div>

        {isLoading && (
          <div className={styles.loadingState}>
            <SparklesIcon
              className={`${styles.iconSparkles} ${styles.spinning}`}
            />
            <p>{t('loading')}</p>
          </div>
        )}

        {error && (
          <div className={styles.errorState}>
            <p className="text-destructive">{error}</p>
            {limitReached && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                  {t('upgradePrompt')}
                </p>
                <LocaleLink
                  href={Routes.Pricing}
                  className="inline-block px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md text-sm font-medium transition-colors"
                >
                  {t('viewPricing')}
                </LocaleLink>
              </div>
            )}
            {signInRequired && (
              <div className="mt-4 p-4 bg-card border rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  {t('signInPrompt')}
                </p>
                <LocaleLink
                  href={Routes.Login}
                  className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium transition-colors hover:bg-primary/90"
                >
                  {t('signInAction')}
                </LocaleLink>
              </div>
            )}
          </div>
        )}

        {answer && (
          <div className={styles.answerCard}>
            <div className={styles.answerHeader}>
              <div>
                <p className={styles.answerEyebrow}>{t('answerTitle')}</p>
                <h2 className={styles.answerHeading}>{t('analysisTitle')}</h2>
              </div>
              <span className={styles.answerModel}>
                {t('answerModel', { model: answer.model })}
              </span>
            </div>

            <div className={styles.answerBody}>
              {answer.content
                .split('\n')
                .map((paragraph, index) =>
                  paragraph.trim() ? (
                    <p key={`${index}-${paragraph.slice(0, 12)}`}>
                      {paragraph}
                    </p>
                  ) : null
                )}
            </div>

            {answer.citations.length > 0 && (
              <div className={styles.answerSources}>
                <h3>{t('answerSourcesTitle')}</h3>
                <div className={styles.answerSourcesList}>
                  {answer.citations.map((citation, index) => (
                    <div key={citation.id} className={styles.answerSourceItem}>
                      <div className={styles.answerSourceMeta}>
                        <span className={styles.answerSourceIndex}>
                          [{index + 1}]
                        </span>
                        <span className={styles.answerSourceTitle}>
                          {citation.title}
                        </span>
                      </div>
                      <p className={styles.answerSourceExcerpt}>
                        {citation.excerpt}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {answerWarning && (
          <div className={styles.answerWarning}>
            <p>{answerWarning}</p>
          </div>
        )}

        {results.length > 0 && (
          <div className={styles.resultsContainer}>
            <div className={styles.resultsHeader}>
              <h2>{t('resultsTitle', { count: results.length })}</h2>
            </div>

            {results.map((match, index) => (
              <div
                key={match.id}
                className={styles.dreamCard}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={styles.cardGlow} />
                <div className={styles.cardContent}>
                  <div className={styles.cardMeta}>
                    <span className={styles.cardDate}>{match.title}</span>
                    <div className={styles.cardSimilarity}>
                      <SparklesIcon className={styles.cardSimilarityIcon} />
                      <span>
                        {typeof match.relevanceScore === 'number'
                          ? t('relevance', {
                              value: Math.round(match.relevanceScore * 100),
                            })
                          : t('similarity', {
                              value: Math.round((1 - match.similarity) * 100),
                            })}
                      </span>
                    </div>
                  </div>
                  <p className={styles.cardInterpretation}>{match.text}</p>
                  <div className={styles.cardTags}>
                    <span className={styles.tag}>{match.file_name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!hasSearched && (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>{t('emptyText')}</p>
          </div>
        )}

        {hasSearched && !isLoading && results.length === 0 && !error && (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>{t('noResults')}</p>
          </div>
        )}
      </div>
    </section>
  );
}
