'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import styles from './dreambook-explorer.module.css';

type DreamCategory = 'fly' | 'water' | 'default';

interface DreamMatch {
  id: string;
  dream: string;
  interpretation: string;
  similarity: number;
  date: string;
  tags: string[];
  source: 'vector' | 'relation';
}

interface DreamAnalysis {
  summary: string;
  commonThemes: string[];
  emotionalTone: string;
  suggestions: string[];
  psychologicalInsight: string;
}

interface DreambookContent {
  examples: Array<{
    label: string;
    query: string;
  }>;
  database: Record<DreamCategory, DreamMatch[]>;
  analysis: Record<DreamCategory, DreamAnalysis>;
}

const dreambookContent: Record<'en' | 'zh', DreambookContent> = {
  zh: {
    examples: [
      { label: '试试：梦见飞翔', query: '梦见飞翔' },
      { label: '试试：梦见水', query: '梦见水' },
    ],
    database: {
      fly: [
        {
          id: '1',
          dream: '梦见自己在天空中自由飞翔，越过高山和海洋',
          interpretation:
            '飞翔梦境通常象征着渴望自由和摆脱束缚，反映了你对突破现状的强烈愿望',
          similarity: 0.96,
          date: '2026-04-11',
          tags: ['自由', '突破', '理想'],
          source: 'vector',
        },
        {
          id: '2',
          dream: '梦见像鸟儿一样展翅飞翔，俯瞰整个城市的灯火',
          interpretation:
            '从高处俯瞰象征着全局观和掌控感，暗示你正在获得新的视角看待问题',
          similarity: 0.93,
          date: '2026-04-09',
          tags: ['视角', '掌控', '启发'],
          source: 'vector',
        },
        {
          id: '3',
          dream: '梦见在云层中穿梭飞行，感受风的力量',
          interpretation:
            '云层代表未知和梦想，穿梭其中表示你正在探索新的可能性',
          similarity: 0.89,
          date: '2026-04-06',
          tags: ['探索', '勇气', '未知'],
          source: 'relation',
        },
        {
          id: '4',
          dream: '梦见飞翔时突然失去高度，但又重新飞起来',
          interpretation:
            '起伏的飞行象征着人生的波折，重新飞起代表你的韧性和恢复力',
          similarity: 0.85,
          date: '2026-04-03',
          tags: ['韧性', '成长', '挑战'],
          source: 'relation',
        },
        {
          id: '5',
          dream: '梦见和一群鸟儿一起在空中飞翔',
          interpretation:
            '群体飞行象征着归属感和协作，反映你对团队和社交联系的需求',
          similarity: 0.82,
          date: '2026-03-30',
          tags: ['归属', '协作', '社交'],
          source: 'vector',
        },
        {
          id: '6',
          dream: '梦见在夜空中飞翔，星星触手可及',
          interpretation:
            '夜空飞行代表内心深处的探索，星星象征着你的梦想和目标',
          similarity: 0.78,
          date: '2026-03-28',
          tags: ['梦想', '内心', '浪漫'],
          source: 'relation',
        },
      ],
      water: [
        {
          id: '7',
          dream: '梦见在清澈的湖水中游泳，水温适宜舒适',
          interpretation:
            '清澈的水象征着情感的纯净和内心的平静，反映你当前的情绪状态良好',
          similarity: 0.94,
          date: '2026-04-10',
          tags: ['平静', '情感', '舒适'],
          source: 'vector',
        },
        {
          id: '8',
          dream: '梦见站在瀑布下，水流冲刷身体',
          interpretation:
            '瀑布象征着情感的释放和净化，暗示你正在经历某种情感的洗涤',
          similarity: 0.91,
          date: '2026-04-07',
          tags: ['净化', '释放', '更新'],
          source: 'vector',
        },
        {
          id: '9',
          dream: '梦见在海浪中漂浮，随波逐流',
          interpretation: '海浪代表生活的起伏，漂浮表示你在学习接纳和顺应变化',
          similarity: 0.87,
          date: '2026-04-04',
          tags: ['接纳', '变化', '顺应'],
          source: 'relation',
        },
        {
          id: '10',
          dream: '梦见雨水滋润干涸的土地',
          interpretation:
            '雨水象征着希望和滋养，干涸的土地代表内心的渴望，这是治愈的信号',
          similarity: 0.84,
          date: '2026-04-01',
          tags: ['希望', '滋养', '治愈'],
          source: 'relation',
        },
        {
          id: '11',
          dream: '梦见潜入深海，看到五彩斑斓的珊瑚',
          interpretation:
            '深海代表潜意识的深处，珊瑚象征着隐藏的美丽和丰富的内在世界',
          similarity: 0.8,
          date: '2026-03-29',
          tags: ['潜意识', '内在', '发现'],
          source: 'vector',
        },
      ],
      default: [
        {
          id: '12',
          dream: '梦见在森林中漫步，阳光透过树叶洒下斑驳的光影',
          interpretation:
            '森林象征着内心的探索，阳光代表希望和温暖，这是一个关于自我发现的梦境',
          similarity: 0.88,
          date: '2026-04-10',
          tags: ['自然', '探索', '宁静'],
          source: 'vector',
        },
        {
          id: '13',
          dream: '梦见站在山顶，俯瞰云海，感受到前所未有的自由',
          interpretation:
            '山顶象征着成就和突破，云海代表开阔的视野，暗示你正在或即将达到新的高度',
          similarity: 0.85,
          date: '2026-04-08',
          tags: ['成就', '自由', '高度'],
          source: 'relation',
        },
        {
          id: '14',
          dream: '梦见在花园里采摘盛开的鲜花',
          interpretation:
            '花园代表生命的美好，采摘鲜花象征着收获和享受生活的甜美时刻',
          similarity: 0.82,
          date: '2026-04-05',
          tags: ['收获', '美好', '喜悦'],
          source: 'vector',
        },
        {
          id: '15',
          dream: '梦见夜空中繁星闪烁，流星划过天际',
          interpretation:
            '星空象征无限可能，流星代表转瞬即逝的机会，鼓励你把握当下',
          similarity: 0.79,
          date: '2026-04-02',
          tags: ['希望', '机会', '浪漫'],
          source: 'relation',
        },
      ],
    },
    analysis: {
      fly: {
        summary:
          '你的梦境主题围绕「飞翔」展开，这是一个充满积极能量的梦境类型。飞翔梦通常出现在人生转折期或追求突破的阶段，反映了你内心深处对自由、成长和超越的渴望。',
        commonThemes: ['自由与解放', '视角转换', '突破限制', '探索未知'],
        emotionalTone: '积极向上，充满希望和动力',
        suggestions: [
          '现在是追求新目标的好时机，你的潜意识在鼓励你勇敢尝试',
          '保持开放的心态，从更高的视角看待当前面临的挑战',
          '相信自己的能力，即使遇到暂时的困难也能重新振作',
        ],
        psychologicalInsight:
          '从心理学角度来看，飞翔梦境与马斯洛需求层次理论中的自我实现需求密切相关。你正处于追求个人成长和潜能发挥的阶段，内心渴望摆脱束缚，实现更高层次的自我价值。',
      },
      water: {
        summary:
          '你的梦境中频繁出现「水」的意象，这是情感和潜意识的重要象征。水的形态多样，每一种都反映了你不同层面的情感状态和心理需求。',
        commonThemes: ['情感流动', '内心净化', '适应变化', '深层探索'],
        emotionalTone: '平和中带有流动性，情感丰富而深刻',
        suggestions: [
          '允许自己的情感自然流露，不要压抑内心的真实感受',
          '这是一个适合进行情感整理和心灵净化的时期',
          '学会像水一样灵活适应，在变化中保持内在的平静',
        ],
        psychologicalInsight:
          '在荣格心理学中，水是集体潜意识的重要原型象征。你的梦境显示出与情感世界的深度连接，这表明你正在进行重要的内在整合工作。',
      },
      default: {
        summary:
          '你的梦境展现出丰富多样的意象，从自然景观到天文现象，反映了你内心世界的多元性和丰富性。这些梦境整体传递出探索、发现和欣赏生命美好的主题。',
        commonThemes: ['自我探索', '内在发现', '生命美好', '追求自由'],
        emotionalTone: '温和宁静，带有探索和欣赏的态度',
        suggestions: [
          '保持对生活的好奇心和探索精神，珍惜每一个发现的时刻',
          '现在是很好的自我反思期，倾听内心的声音',
          '记录下这些美好的梦境，它们是你内心智慧的礼物',
        ],
        psychologicalInsight:
          '你的梦境呈现出健康的心理状态，显示出良好的自我觉察能力。从心理发展的角度看，你正在经历一个整合性的成长阶段，各种梦境意象共同编织出你独特的内在叙事。',
      },
    },
  },
  en: {
    examples: [
      { label: 'Try: Flying', query: 'flying' },
      { label: 'Try: Water', query: 'water' },
    ],
    database: {
      fly: [
        {
          id: '1',
          dream:
            'I dreamed I was flying freely through the sky, crossing mountains and oceans.',
          interpretation:
            'Flying dreams often symbolize a desire for freedom and release from constraints, reflecting a strong urge to break through the current situation.',
          similarity: 0.96,
          date: '2026-04-11',
          tags: ['freedom', 'breakthrough', 'ideals'],
          source: 'vector',
        },
        {
          id: '2',
          dream:
            'I dreamed I spread my wings like a bird and looked down at a city full of lights.',
          interpretation:
            'Looking down from above points to perspective and control, suggesting that you are gaining a broader view of your current challenges.',
          similarity: 0.93,
          date: '2026-04-09',
          tags: ['perspective', 'control', 'insight'],
          source: 'vector',
        },
        {
          id: '3',
          dream:
            'I dreamed I was weaving through clouds and feeling the force of the wind.',
          interpretation:
            'Clouds represent the unknown and aspiration. Moving through them suggests you are exploring new possibilities.',
          similarity: 0.89,
          date: '2026-04-06',
          tags: ['exploration', 'courage', 'unknown'],
          source: 'relation',
        },
        {
          id: '4',
          dream:
            'I dreamed I suddenly lost altitude while flying, but rose back up again.',
          interpretation:
            'The ups and downs of flight mirror life’s fluctuations, while rising again points to resilience and recovery.',
          similarity: 0.85,
          date: '2026-04-03',
          tags: ['resilience', 'growth', 'challenge'],
          source: 'relation',
        },
        {
          id: '5',
          dream: 'I dreamed I was flying in the sky with a flock of birds.',
          interpretation:
            'Group flight symbolizes belonging and collaboration, reflecting a need for team connection and social support.',
          similarity: 0.82,
          date: '2026-03-30',
          tags: ['belonging', 'collaboration', 'social'],
          source: 'vector',
        },
        {
          id: '6',
          dream:
            'I dreamed I was flying through the night sky with stars within reach.',
          interpretation:
            'Night flight suggests inner exploration, while stars symbolize your dreams and long-term goals.',
          similarity: 0.78,
          date: '2026-03-28',
          tags: ['dreams', 'inner world', 'romance'],
          source: 'relation',
        },
      ],
      water: [
        {
          id: '7',
          dream:
            'I dreamed I was swimming in a crystal-clear lake and the water felt perfect.',
          interpretation:
            'Clear water symbolizes emotional clarity and inner calm, suggesting your current emotional state is relatively balanced.',
          similarity: 0.94,
          date: '2026-04-10',
          tags: ['calm', 'emotion', 'comfort'],
          source: 'vector',
        },
        {
          id: '8',
          dream:
            'I dreamed I was standing under a waterfall while the water washed over me.',
          interpretation:
            'A waterfall symbolizes release and cleansing, suggesting you are moving through a process of emotional purification.',
          similarity: 0.91,
          date: '2026-04-07',
          tags: ['cleansing', 'release', 'renewal'],
          source: 'vector',
        },
        {
          id: '9',
          dream:
            'I dreamed I was floating in ocean waves and letting them carry me.',
          interpretation:
            'Waves represent the rise and fall of life. Floating with them points to learning how to accept and adapt to change.',
          similarity: 0.87,
          date: '2026-04-04',
          tags: ['acceptance', 'change', 'adaptation'],
          source: 'relation',
        },
        {
          id: '10',
          dream: 'I dreamed rain was nourishing dry and cracked ground.',
          interpretation:
            'Rain symbolizes hope and nourishment. Dry land represents inner longing, making this a sign of healing.',
          similarity: 0.84,
          date: '2026-04-01',
          tags: ['hope', 'nourishment', 'healing'],
          source: 'relation',
        },
        {
          id: '11',
          dream:
            'I dreamed I dived into the deep sea and found colorful coral below.',
          interpretation:
            'The deep sea points to the unconscious, while coral symbolizes hidden beauty and a rich inner world.',
          similarity: 0.8,
          date: '2026-03-29',
          tags: ['unconscious', 'inner world', 'discovery'],
          source: 'vector',
        },
      ],
      default: [
        {
          id: '12',
          dream:
            'I dreamed I was walking through a forest while sunlight scattered through the leaves.',
          interpretation:
            'The forest symbolizes inner exploration and sunlight represents hope and warmth, pointing to a dream of self-discovery.',
          similarity: 0.88,
          date: '2026-04-10',
          tags: ['nature', 'exploration', 'peace'],
          source: 'vector',
        },
        {
          id: '13',
          dream:
            'I dreamed I stood on a mountain peak above a sea of clouds and felt an unfamiliar freedom.',
          interpretation:
            'A mountaintop symbolizes achievement and breakthrough, while a cloud sea suggests a wider field of vision and a new height in life.',
          similarity: 0.85,
          date: '2026-04-08',
          tags: ['achievement', 'freedom', 'altitude'],
          source: 'relation',
        },
        {
          id: '14',
          dream: 'I dreamed I was gathering blooming flowers in a garden.',
          interpretation:
            'A garden represents life’s beauty, and picking flowers symbolizes harvest, delight, and enjoying the sweetness of the present moment.',
          similarity: 0.82,
          date: '2026-04-05',
          tags: ['harvest', 'beauty', 'joy'],
          source: 'vector',
        },
        {
          id: '15',
          dream:
            'I dreamed of a star-filled night sky with a shooting star crossing overhead.',
          interpretation:
            'The night sky symbolizes possibility, while a shooting star suggests fleeting opportunities and the need to act in the present.',
          similarity: 0.79,
          date: '2026-04-02',
          tags: ['hope', 'opportunity', 'romance'],
          source: 'relation',
        },
      ],
    },
    analysis: {
      fly: {
        summary:
          'Your dream theme revolves around flying, a dream type charged with positive energy. Flying dreams often appear during transitions or periods of personal breakthrough, reflecting a deep longing for freedom, growth, and transcendence.',
        commonThemes: [
          'freedom and release',
          'shifting perspective',
          'breaking limits',
          'exploring the unknown',
        ],
        emotionalTone: 'uplifting, hopeful, and full of forward momentum',
        suggestions: [
          'This is a good time to pursue a new goal. Your subconscious is encouraging you to be bold.',
          'Keep an open mind and try to look at your current challenges from a higher vantage point.',
          'Trust your abilities. Even if you lose height for a while, you can rise again.',
        ],
        psychologicalInsight:
          'From a psychological perspective, flying dreams are often linked to self-actualization. They can indicate a phase in which you are trying to unlock more of your potential and move beyond external constraints.',
      },
      water: {
        summary:
          'Water appears repeatedly in your dream imagery, making it an important symbol of emotion and the unconscious. Its different forms suggest different layers of feeling, regulation, and inner need.',
        commonThemes: [
          'emotional flow',
          'inner cleansing',
          'adapting to change',
          'deep exploration',
        ],
        emotionalTone: 'calm, fluid, and emotionally rich',
        suggestions: [
          'Let your feelings move naturally instead of suppressing them.',
          'This is a strong period for emotional processing and inner renewal.',
          'Practice adapting like water while keeping your center steady.',
        ],
        psychologicalInsight:
          'In Jungian psychology, water is a major symbol of the collective unconscious. These dreams suggest you are in an active process of integrating deeper emotional material.',
      },
      default: {
        summary:
          'Your dream imagery is diverse, ranging from natural landscapes to celestial scenes, reflecting a rich and layered inner world. The overall theme leans toward exploration, discovery, and appreciation of life.',
        commonThemes: [
          'self-exploration',
          'inner discovery',
          'life’s beauty',
          'the pursuit of freedom',
        ],
        emotionalTone: 'gentle, reflective, and quietly curious',
        suggestions: [
          'Stay curious about your experience and keep noticing what draws your attention.',
          'This is a good period for reflection and listening to your inner voice.',
          'Write down meaningful dreams. They can become part of your own inner map.',
        ],
        psychologicalInsight:
          'These dreams suggest a generally healthy level of self-awareness. Psychologically, they resemble an integrative growth phase in which different images work together to form a coherent inner narrative.',
      },
    },
  },
};

function getDreamCategory(query: string): DreamCategory {
  const normalized = query.toLowerCase();

  if (
    query.includes('飞') ||
    normalized.includes('fly') ||
    normalized.includes('flying') ||
    normalized.includes('flight') ||
    normalized.includes('soar')
  ) {
    return 'fly';
  }

  if (
    query.includes('水') ||
    query.includes('海') ||
    query.includes('湖') ||
    query.includes('雨') ||
    normalized.includes('water') ||
    normalized.includes('sea') ||
    normalized.includes('ocean') ||
    normalized.includes('lake') ||
    normalized.includes('rain')
  ) {
    return 'water';
  }

  return 'default';
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

function BrainIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
    </IconBase>
  );
}

function HeartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </IconBase>
  );
}

function LightbulbIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </IconBase>
  );
}

function TrendingIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </IconBase>
  );
}

export function DreambookExplorer() {
  const t = useTranslations('DreambookPage');
  const locale = useLocale();
  const content = locale.startsWith('zh')
    ? dreambookContent.zh
    : dreambookContent.en;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DreamMatch[]>([]);
  const [analysis, setAnalysis] = useState<DreamAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const timeoutsRef = useRef<number[]>([]);

  const clearPendingTimeouts = () => {
    timeoutsRef.current.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    timeoutsRef.current = [];
  };

  useEffect(() => {
    return () => {
      clearPendingTimeouts();
    };
  }, []);

  const performSearch = (nextQuery = query) => {
    const trimmedQuery = nextQuery.trim();

    if (!trimmedQuery || isLoading) {
      return;
    }

    clearPendingTimeouts();
    setQuery(trimmedQuery);
    setHasSearched(true);
    setIsLoading(true);
    setResults([]);
    setAnalysis(null);

    const category = getDreamCategory(trimmedQuery);
    const searchTimeout = window.setTimeout(() => {
      setResults(content.database[category]);
      setIsLoading(false);

      const analysisTimeout = window.setTimeout(() => {
        setAnalysis(content.analysis[category]);
      }, 600);

      timeoutsRef.current.push(analysisTimeout);
    }, 1000);

    timeoutsRef.current.push(searchTimeout);
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
        </div>

        {isLoading && (
          <div className={styles.loadingState}>
            <SparklesIcon
              className={`${styles.iconSparkles} ${styles.spinning}`}
            />
            <p>{t('loading')}</p>
          </div>
        )}

        {results.length > 0 && (
          <div className={styles.resultsContainer}>
            <div className={styles.resultsHeader}>
              <h2>{t('resultsTitle', { count: results.length })}</h2>
              <div className={styles.sourceBadges}>
                <span className={`${styles.sourceBadge} ${styles.badgeVector}`}>
                  {t('sources.vector')}
                </span>
                <span
                  className={`${styles.sourceBadge} ${styles.badgeRelation}`}
                >
                  {t('sources.relation')}
                </span>
              </div>
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
                    <div
                      className={`${styles.sourceIndicator} ${
                        match.source === 'vector'
                          ? styles.sourceVector
                          : styles.sourceRelation
                      }`}
                    />
                    <span className={styles.cardDate}>{match.date}</span>
                    <div className={styles.cardSimilarity}>
                      <SparklesIcon className={styles.cardSimilarityIcon} />
                      <span>
                        {t('similarity', {
                          value: Math.round(match.similarity * 100),
                        })}
                      </span>
                    </div>
                  </div>
                  <h3 className={styles.cardDream}>{match.dream}</h3>
                  <p className={styles.cardInterpretation}>
                    {match.interpretation}
                  </p>
                  <div className={styles.cardTags}>
                    {match.tags.map((tag) => (
                      <span key={tag} className={styles.tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {analysis && (
          <div className={styles.aiAnalysisContainer}>
            <div className={styles.aiAnalysisWrap}>
              <div className={styles.aiAnalysisGlow} />
              <div className={styles.aiAnalysisBox}>
                <div className={styles.aiHeader}>
                  <div className={styles.aiIcon}>
                    <BrainIcon className={styles.sectionIcon} />
                  </div>
                  <h2 className={styles.aiTitle}>{t('analysisTitle')}</h2>
                </div>

                <div className={styles.aiSummary}>
                  <p>{analysis.summary}</p>
                </div>

                <div className={styles.aiSection}>
                  <div className={styles.sectionHeader}>
                    <SparklesIcon className={styles.sectionIcon} />
                    <h3>{t('sections.themes')}</h3>
                  </div>
                  <div className={styles.themesGrid}>
                    {analysis.commonThemes.map((theme, index) => (
                      <div
                        key={theme}
                        className={styles.themeTag}
                        style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                      >
                        {theme}
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.aiSection}>
                  <div className={styles.sectionHeader}>
                    <HeartIcon className={styles.sectionIcon} />
                    <h3>{t('sections.emotion')}</h3>
                  </div>
                  <div className={styles.emotionBox}>
                    <p>{analysis.emotionalTone}</p>
                  </div>
                </div>

                <div className={styles.aiSection}>
                  <div className={styles.sectionHeader}>
                    <LightbulbIcon className={styles.sectionIcon} />
                    <h3>{t('sections.suggestions')}</h3>
                  </div>
                  <div className={styles.suggestionsList}>
                    {analysis.suggestions.map((suggestion, index) => (
                      <div
                        key={suggestion}
                        className={styles.suggestionItem}
                        style={{ animationDelay: `${0.7 + index * 0.1}s` }}
                      >
                        <div className={styles.suggestionDot} />
                        <p className={styles.suggestionText}>{suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.aiSection}>
                  <div className={styles.sectionHeader}>
                    <TrendingIcon className={styles.sectionIcon} />
                    <h3>{t('sections.insight')}</h3>
                  </div>
                  <div className={styles.insightBox}>
                    <p className={styles.insightText}>
                      {analysis.psychologicalInsight}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!hasSearched && (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>{t('emptyText')}</p>
            <div className={styles.exampleButtons}>
              {content.examples.map((example) => (
                <button
                  key={example.label}
                  type="button"
                  className={styles.exampleButton}
                  onClick={() => performSearch(example.query)}
                >
                  {example.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
