export interface TaxonomyEntry {
  canonical: string;
  aliases: string[];
}

export const DREAM_SYMBOLS_ZH: TaxonomyEntry[] = [
  { canonical: '飞翔', aliases: ['飞', '飞翔', '飞起来', '腾空', '飞行'] },
  { canonical: '坠落', aliases: ['坠落', '掉下去', '下坠', '跌落', '失重'] },
  { canonical: '蛇', aliases: ['蛇', '蟒蛇', '毒蛇', '小蛇'] },
  { canonical: '水', aliases: ['水', '海', '湖', '河', '雨', '洪水'] },
  { canonical: '掉牙', aliases: ['掉牙', '牙齿掉了', '牙松动', '掉牙齿'] },
  { canonical: '追逐', aliases: ['追', '追逐', '被追', '逃跑'] },
  { canonical: '死亡', aliases: ['死亡', '死去', '死人', '去世'] },
  { canonical: '亲人', aliases: ['亲人', '父母', '妈妈', '爸爸', '家人'] },
];

export const DREAM_SYMBOLS_EN: TaxonomyEntry[] = [
  {
    canonical: 'flying',
    aliases: ['fly', 'flying', 'flight', 'soar', 'soaring'],
  },
  {
    canonical: 'falling',
    aliases: ['fall', 'falling', 'drop', 'dropping', 'free fall'],
  },
  { canonical: 'snake', aliases: ['snake', 'serpent', 'python', 'cobra'] },
  { canonical: 'water', aliases: ['water', 'sea', 'ocean', 'lake', 'rain'] },
  {
    canonical: 'teeth_loss',
    aliases: ['teeth', 'tooth', 'losing teeth', 'tooth falling out'],
  },
  {
    canonical: 'being_chased',
    aliases: ['chased', 'being chased', 'running away', 'pursued'],
  },
  { canonical: 'death', aliases: ['death', 'dead', 'dying', 'funeral'] },
];

export const EMOTIONS_ZH: TaxonomyEntry[] = [
  { canonical: '恐惧', aliases: ['害怕', '恐惧', '惊慌', '吓坏了'] },
  { canonical: '焦虑', aliases: ['焦虑', '不安', '紧张', '慌张'] },
  { canonical: '羞耻', aliases: ['羞耻', '尴尬', '丢脸', '羞愧'] },
  { canonical: '悲伤', aliases: ['悲伤', '难过', '伤心', '痛苦'] },
  { canonical: '轻松', aliases: ['轻松', '释然', '解脱', '舒服'] },
  { canonical: '愤怒', aliases: ['愤怒', '生气', '恼火', '暴怒'] },
];

export const EMOTIONS_EN: TaxonomyEntry[] = [
  { canonical: 'fear', aliases: ['fear', 'afraid', 'terrified', 'panic'] },
  {
    canonical: 'anxiety',
    aliases: ['anxiety', 'anxious', 'uneasy', 'nervous'],
  },
  { canonical: 'shame', aliases: ['shame', 'embarrassed', 'humiliated'] },
  { canonical: 'sadness', aliases: ['sad', 'sadness', 'grief', 'sorrow'] },
  { canonical: 'relief', aliases: ['relief', 'released', 'light', 'calm'] },
  { canonical: 'anger', aliases: ['anger', 'angry', 'furious', 'rage'] },
];

export const SOURCE_HINTS_ZH: TaxonomyEntry[] = [
  { canonical: '心理学', aliases: ['心理学', '弗洛伊德', '荣格'] },
  { canonical: '民俗', aliases: ['周公', '民俗', '传统解梦'] },
  { canonical: '西方', aliases: ['西方', '国外', '英文文献'] },
];

export const SOURCE_HINTS_EN: TaxonomyEntry[] = [
  { canonical: 'psychology', aliases: ['psychology', 'freud', 'jung'] },
  { canonical: 'folklore', aliases: ['folklore', 'traditional', 'zhougong'] },
  { canonical: 'western', aliases: ['western', 'english source'] },
];

export const FOLLOW_UP_MARKERS_ZH = [
  '刚才',
  '上面',
  '这个',
  '那你说的',
  '为什么会这样',
  '这说明什么',
];

export const FOLLOW_UP_MARKERS_EN = [
  'you said',
  'above',
  'earlier',
  'that means',
  'why is that',
  'what does that mean',
];

export const COMPARE_MARKERS_ZH = [
  '区别',
  '不同',
  '对比',
  '怎么看',
  '谁更合理',
  '哪个更像',
];

export const COMPARE_MARKERS_EN = [
  'difference',
  'compare',
  'compared to',
  'how do',
  'which is more',
  'versus',
];

export const SYMBOL_LOOKUP_PATTERNS = [
  '什么意思',
  '代表什么',
  '象征什么',
  '是什么意思',
  'what does',
  'what is the meaning',
  'symbolize',
];
