export interface SymbolEntry {
  canonical: string;
  aliases: string[];
  tags: string[];
}

export interface SymbolNormalizationResult {
  rawSymbols: string[];
  normalizedSymbols: string[];
  tags: string[];
  entries: SymbolEntry[];
}

export const CURATED_SYMBOLS: SymbolEntry[] = [
  {
    canonical: '蛇',
    aliases: ['巨蟒', '毒蛇', '白蛇', '蟒蛇', 'snake', 'serpent', 'python'],
    tags: ['动物', '危险', '恐惧'],
  },
  {
    canonical: '狗',
    aliases: ['大黄狗', '小狗', '黑狗', '犬', 'dog', 'puppy'],
    tags: ['动物', '关系', '忠诚'],
  },
  {
    canonical: '牙齿',
    aliases: ['门牙', '大牙', '牙掉了', '掉牙', 'tooth', 'teeth'],
    tags: ['身体', '焦虑', '变化'],
  },
  {
    canonical: '飞行',
    aliases: ['飞起来', '升空', '会飞', '飞翔', 'flying', 'fly'],
    tags: ['行动', '自由', '上升'],
  },
  {
    canonical: '被追赶',
    aliases: ['追我', '被追', '逃跑', '追赶', 'chased', 'running away'],
    tags: ['行动', '恐惧', '压力'],
  },
  {
    canonical: '水',
    aliases: ['河水', '海水', '洪水', '湖水', 'water', 'river', 'sea'],
    tags: ['自然', '情绪', '潜意识'],
  },
  {
    canonical: '火',
    aliases: ['着火', '大火', '火灾', 'flame', 'fire', 'burning'],
    tags: ['自然', '危险', '转化'],
  },
  {
    canonical: '房子',
    aliases: ['房屋', '家里', '老房子', 'house', 'home', 'room'],
    tags: ['空间', '自我', '安全'],
  },
  {
    canonical: '学校',
    aliases: ['教室', '考试', '上学', 'school', 'classroom', 'exam'],
    tags: ['场景', '评价', '学习'],
  },
  {
    canonical: '死亡',
    aliases: ['死人', '去世', '葬礼', 'death', 'dead', 'funeral'],
    tags: ['生命', '结束', '变化'],
  },
  {
    canonical: '怀孕',
    aliases: ['孕妇', '生孩子', '怀胎', 'pregnant', 'pregnancy', 'birth'],
    tags: ['生命', '创造', '变化'],
  },
  {
    canonical: '婴儿',
    aliases: ['宝宝', '小孩', '新生儿', '生孩子', 'baby', 'infant', 'child'],
    tags: ['生命', '新开始', '脆弱'],
  },
  {
    canonical: '猫',
    aliases: ['小猫', '黑猫', '白猫', 'cat', 'kitten'],
    tags: ['动物', '独立', '直觉'],
  },
  {
    canonical: '鱼',
    aliases: ['金鱼', '大鱼', '鲤鱼', 'fish', 'goldfish'],
    tags: ['动物', '水', '资源'],
  },
  {
    canonical: '鸟',
    aliases: ['小鸟', '乌鸦', '鸽子', 'bird', 'crow', 'dove'],
    tags: ['动物', '消息', '自由'],
  },
  {
    canonical: '马',
    aliases: ['白马', '黑马', '骑马', 'horse', 'riding horse'],
    tags: ['动物', '力量', '行动'],
  },
  {
    canonical: '牛',
    aliases: ['黄牛', '水牛', '公牛', 'cow', 'bull', 'ox'],
    tags: ['动物', '劳动', '稳定'],
  },
  {
    canonical: '猪',
    aliases: ['小猪', '野猪', '肥猪', 'pig', 'boar'],
    tags: ['动物', '物质', '欲望'],
  },
  {
    canonical: '老虎',
    aliases: ['虎', '猛虎', 'tiger'],
    tags: ['动物', '力量', '威胁'],
  },
  {
    canonical: '狮子',
    aliases: ['雄狮', 'lion'],
    tags: ['动物', '权威', '力量'],
  },
  {
    canonical: '狼',
    aliases: ['野狼', '灰狼', 'wolf'],
    tags: ['动物', '威胁', '本能'],
  },
  {
    canonical: '老鼠',
    aliases: ['耗子', '鼠', 'rat', 'mouse'],
    tags: ['动物', '隐患', '细节'],
  },
  {
    canonical: '虫子',
    aliases: ['昆虫', '虫', '蛆', 'bug', 'insect', 'worm'],
    tags: ['动物', '烦扰', '不适'],
  },
  {
    canonical: '蜘蛛',
    aliases: ['蜘蛛网', 'spider', 'web'],
    tags: ['动物', '纠缠', '控制'],
  },
  {
    canonical: '龙',
    aliases: ['金龙', '飞龙', 'dragon'],
    tags: ['神话', '力量', '转化'],
  },
  {
    canonical: '鬼',
    aliases: ['幽灵', '恶鬼', 'ghost', 'spirit'],
    tags: ['超自然', '恐惧', '过去'],
  },
  {
    canonical: '神佛',
    aliases: ['神仙', '佛', '菩萨', 'god', 'buddha', 'deity'],
    tags: ['宗教', '保护', '权威'],
  },
  {
    canonical: '父亲',
    aliases: ['爸爸', '爸', 'father', 'dad'],
    tags: ['家人', '权威', '支持'],
  },
  {
    canonical: '母亲',
    aliases: ['妈妈', '妈', 'mother', 'mom'],
    tags: ['家人', '照顾', '情感'],
  },
  {
    canonical: '伴侣',
    aliases: ['恋人', '男朋友', '女朋友', '丈夫', '妻子', 'lover', 'partner'],
    tags: ['关系', '亲密', '承诺'],
  },
  {
    canonical: '陌生人',
    aliases: ['陌生男人', '陌生女人', 'stranger', 'unknown person'],
    tags: ['人物', '未知', '投射'],
  },
  {
    canonical: '朋友',
    aliases: ['好友', '同学', '同事', 'friend', 'classmate', 'coworker'],
    tags: ['关系', '社交', '支持'],
  },
  {
    canonical: '敌人',
    aliases: ['仇人', '坏人', 'enemy', 'attacker'],
    tags: ['关系', '冲突', '威胁'],
  },
  {
    canonical: '钱',
    aliases: ['钞票', '现金', '金币', 'money', 'cash', 'coin'],
    tags: ['物质', '价值', '资源'],
  },
  {
    canonical: '黄金',
    aliases: ['金子', '金条', '金币', 'gold'],
    tags: ['物质', '价值', '财富'],
  },
  {
    canonical: '珠宝',
    aliases: ['首饰', '戒指', '项链', 'jewelry', 'ring', 'necklace'],
    tags: ['物质', '价值', '承诺'],
  },
  {
    canonical: '衣服',
    aliases: ['衣物', '新衣服', 'clothes', 'clothing', 'dress'],
    tags: ['物品', '身份', '形象'],
  },
  {
    canonical: '鞋',
    aliases: ['鞋子', '皮鞋', '拖鞋', 'shoes', 'shoe'],
    tags: ['物品', '行动', '道路'],
  },
  {
    canonical: '镜子',
    aliases: ['照镜子', 'mirror'],
    tags: ['物品', '自我', '反省'],
  },
  {
    canonical: '钥匙',
    aliases: ['开锁', 'key', 'unlock'],
    tags: ['物品', '机会', '进入'],
  },
  {
    canonical: '门',
    aliases: ['大门', '房门', '门口', 'door', 'gate'],
    tags: ['空间', '机会', '边界'],
  },
  {
    canonical: '窗户',
    aliases: ['窗', 'window'],
    tags: ['空间', '视野', '出口'],
  },
  {
    canonical: '桥',
    aliases: ['过桥', 'bridge'],
    tags: ['空间', '过渡', '连接'],
  },
  {
    canonical: '路',
    aliases: ['道路', '小路', '迷路', 'road', 'path', 'lost'],
    tags: ['空间', '方向', '人生'],
  },
  {
    canonical: '车',
    aliases: ['汽车', '公交车', '开车', 'car', 'bus', 'driving'],
    tags: ['交通', '控制', '进展'],
  },
  {
    canonical: '火车',
    aliases: ['列车', 'train', 'railway'],
    tags: ['交通', '轨道', '进程'],
  },
  {
    canonical: '飞机',
    aliases: ['坐飞机', 'airplane', 'plane'],
    tags: ['交通', '远行', '上升'],
  },
  {
    canonical: '船',
    aliases: ['坐船', '轮船', 'boat', 'ship'],
    tags: ['交通', '水', '过渡'],
  },
  {
    canonical: '山',
    aliases: ['高山', '爬山', 'mountain', 'hill'],
    tags: ['自然', '目标', '阻碍'],
  },
  {
    canonical: '树',
    aliases: ['大树', '森林', 'tree', 'forest'],
    tags: ['自然', '成长', '根基'],
  },
  {
    canonical: '花',
    aliases: ['鲜花', '玫瑰', 'flower', 'rose'],
    tags: ['自然', '美', '关系'],
  },
  {
    canonical: '雨',
    aliases: ['下雨', '暴雨', 'rain', 'storm'],
    tags: ['自然', '情绪', '释放'],
  },
  {
    canonical: '雪',
    aliases: ['下雪', 'snow'],
    tags: ['自然', '寒冷', '净化'],
  },
  {
    canonical: '风',
    aliases: ['大风', 'wind'],
    tags: ['自然', '变化', '不稳定'],
  },
  {
    canonical: '太阳',
    aliases: ['日出', '阳光', 'sun', 'sunrise'],
    tags: ['自然', '能量', '清晰'],
  },
  {
    canonical: '月亮',
    aliases: ['月光', 'moon'],
    tags: ['自然', '情绪', '女性'],
  },
  {
    canonical: '星星',
    aliases: ['星空', 'star', 'stars'],
    tags: ['自然', '希望', '远方'],
  },
  {
    canonical: '血',
    aliases: ['流血', '出血', 'blood', 'bleeding'],
    tags: ['身体', '生命力', '受伤'],
  },
  {
    canonical: '头发',
    aliases: ['长发', '剪头发', 'hair', 'haircut'],
    tags: ['身体', '形象', '力量'],
  },
  {
    canonical: '眼睛',
    aliases: ['眼', '看不见', 'eye', 'eyes', 'blind'],
    tags: ['身体', '洞察', '视野'],
  },
  {
    canonical: '手',
    aliases: ['手指', '双手', 'hand', 'finger'],
    tags: ['身体', '能力', '行动'],
  },
  {
    canonical: '脚',
    aliases: ['脚趾', '双脚', 'foot', 'feet'],
    tags: ['身体', '稳定', '行动'],
  },
  {
    canonical: '裸露',
    aliases: ['裸体', '没穿衣服', 'naked', 'nude'],
    tags: ['身体', '暴露', '羞耻'],
  },
  {
    canonical: '受伤',
    aliases: ['伤口', '受伤了', 'injury', 'wound', 'hurt'],
    tags: ['身体', '脆弱', '疼痛'],
  },
  {
    canonical: '生病',
    aliases: ['疾病', '医院', 'illness', 'sick', 'hospital'],
    tags: ['身体', '焦虑', '照顾'],
  },
  {
    canonical: '坠落',
    aliases: ['掉下去', '掉进', '摔下去', 'falling', 'fall'],
    tags: ['行动', '失控', '恐惧'],
  },
  {
    canonical: '游泳',
    aliases: ['游水', 'swimming', 'swim'],
    tags: ['行动', '水', '适应'],
  },
  {
    canonical: '跳跃',
    aliases: ['跳起来', '跳下去', 'jump', 'leap'],
    tags: ['行动', '冒险', '转变'],
  },
  {
    canonical: '考试',
    aliases: ['测验', '考不好', 'exam', 'test'],
    tags: ['评价', '压力', '能力'],
  },
  {
    canonical: '迟到',
    aliases: ['来不及', '赶不上', 'late', 'missed'],
    tags: ['时间', '压力', '机会'],
  },
  {
    canonical: '迷路',
    aliases: ['找不到路', '走丢', 'lost', 'lose way'],
    tags: ['方向', '困惑', '选择'],
  },
  {
    canonical: '结婚',
    aliases: ['婚礼', '婚纱', 'marriage', 'wedding'],
    tags: ['关系', '承诺', '转变'],
  },
  {
    canonical: '离婚',
    aliases: ['分手', '离别', 'breakup', 'divorce'],
    tags: ['关系', '分离', '结束'],
  },
  {
    canonical: '争吵',
    aliases: ['吵架', '打架', 'fight', 'argument'],
    tags: ['关系', '冲突', '情绪'],
  },
  {
    canonical: '哭',
    aliases: ['哭泣', '流泪', 'cry', 'tears'],
    tags: ['情绪', '悲伤', '释放'],
  },
  {
    canonical: '笑',
    aliases: ['大笑', '开心', 'laugh', 'smile'],
    tags: ['情绪', '快乐', '释放'],
  },
  {
    canonical: '害怕',
    aliases: ['恐惧', '惊恐', 'afraid', 'fear', 'scared'],
    tags: ['情绪', '威胁', '警觉'],
  },
  {
    canonical: '愤怒',
    aliases: ['生气', '发火', 'angry', 'anger'],
    tags: ['情绪', '边界', '冲突'],
  },
  {
    canonical: '快乐',
    aliases: ['高兴', '幸福', 'happy', 'joy'],
    tags: ['情绪', '满足', '能量'],
  },
  {
    canonical: '黑暗',
    aliases: ['很黑', '夜晚', 'dark', 'night'],
    tags: ['场景', '未知', '恐惧'],
  },
  {
    canonical: '光',
    aliases: ['亮光', '灯光', 'light', 'lamp'],
    tags: ['场景', '清晰', '希望'],
  },
  {
    canonical: '电梯',
    aliases: ['升降机', 'elevator', 'lift'],
    tags: ['空间', '升降', '状态变化'],
  },
  {
    canonical: '楼梯',
    aliases: ['台阶', 'stairs', 'staircase'],
    tags: ['空间', '上升', '过程'],
  },
  {
    canonical: '厕所',
    aliases: ['卫生间', 'bathroom', 'toilet'],
    tags: ['空间', '排泄', '隐私'],
  },
  {
    canonical: '厨房',
    aliases: ['做饭', 'kitchen', 'cooking'],
    tags: ['空间', '滋养', '家庭'],
  },
  {
    canonical: '床',
    aliases: ['睡床', 'bed'],
    tags: ['空间', '休息', '亲密'],
  },
  {
    canonical: '棺材',
    aliases: ['棺木', 'coffin'],
    tags: ['死亡', '结束', '传统占梦'],
  },
  {
    canonical: '坟墓',
    aliases: ['墓地', 'grave', 'cemetery'],
    tags: ['死亡', '过去', '纪念'],
  },
  {
    canonical: '火山',
    aliases: ['岩浆', 'volcano', 'lava'],
    tags: ['自然', '压抑', '爆发'],
  },
  {
    canonical: '地震',
    aliases: ['震动', 'earthquake'],
    tags: ['自然', '动荡', '不稳定'],
  },
  {
    canonical: '洪水',
    aliases: ['大水', 'flood'],
    tags: ['自然', '情绪', '失控'],
  },
  {
    canonical: '海洋',
    aliases: ['大海', '海', 'ocean', 'sea'],
    tags: ['自然', '潜意识', '广阔'],
  },
  {
    canonical: '井',
    aliases: ['水井', 'well'],
    tags: ['空间', '资源', '深处'],
  },
  {
    canonical: '监狱',
    aliases: ['牢房', 'prison', 'jail'],
    tags: ['空间', '限制', '束缚'],
  },
  {
    canonical: '警察',
    aliases: ['民警', 'police', 'cop'],
    tags: ['人物', '规则', '约束'],
  },
  {
    canonical: '医生',
    aliases: ['医师', 'doctor', 'physician'],
    tags: ['人物', '修复', '照顾'],
  },
  {
    canonical: '老师',
    aliases: ['教师', 'teacher'],
    tags: ['人物', '评价', '指导'],
  },
  {
    canonical: '老板',
    aliases: ['上司', '领导', 'boss', 'manager'],
    tags: ['人物', '权威', '工作'],
  },
  {
    canonical: '工作',
    aliases: ['上班', '办公室', 'work', 'office', 'job'],
    tags: ['场景', '责任', '压力'],
  },
  {
    canonical: '旅行',
    aliases: ['旅游', '远行', 'travel', 'trip', 'journey'],
    tags: ['行动', '转变', '探索'],
  },
  {
    canonical: '手机',
    aliases: ['电话', '打电话', 'phone', 'mobile'],
    tags: ['物品', '沟通', '联系'],
  },
  {
    canonical: '书',
    aliases: ['书本', '读书', 'book', 'reading'],
    tags: ['物品', '知识', '学习'],
  },
  {
    canonical: '食物',
    aliases: ['吃饭', '饭菜', 'food', 'meal', 'eating'],
    tags: ['物品', '滋养', '欲望'],
  },
  {
    canonical: '酒',
    aliases: ['喝酒', 'wine', 'alcohol'],
    tags: ['物品', '放松', '失控'],
  },
  {
    canonical: '药',
    aliases: ['吃药', 'medicine', 'pill'],
    tags: ['物品', '治疗', '依赖'],
  },
  {
    canonical: '刀',
    aliases: ['菜刀', '匕首', 'knife', 'blade'],
    tags: ['物品', '危险', '切割'],
  },
  {
    canonical: '枪',
    aliases: ['手枪', '开枪', 'gun', 'shooting'],
    tags: ['物品', '攻击', '威胁'],
  },
  {
    canonical: '音乐',
    aliases: ['唱歌', '歌声', 'music', 'song', 'singing'],
    tags: ['感官', '表达', '情绪'],
  },
  {
    canonical: '舞蹈',
    aliases: ['跳舞', 'dance', 'dancing'],
    tags: ['行动', '表达', '身体'],
  },
];

const aliasIndex = new Map<string, SymbolEntry>();

for (const entry of CURATED_SYMBOLS) {
  aliasIndex.set(entry.canonical.toLowerCase(), entry);

  for (const alias of entry.aliases) {
    aliasIndex.set(alias.toLowerCase(), entry);
  }
}

function dedupe(values: string[]): string[] {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean))
  );
}

function includesAlias(text: string, alias: string): boolean {
  if (/[a-zA-Z]/.test(alias)) {
    return text.toLowerCase().includes(alias.toLowerCase());
  }

  return text.includes(alias);
}

export function normalizeSymbolTerm(term: string): SymbolEntry | null {
  return aliasIndex.get(term.trim().toLowerCase()) || null;
}

export function normalizeSymbolTerms(
  input: string | string[]
): SymbolNormalizationResult {
  const rawTerms = Array.isArray(input) ? input : [input];
  const rawSymbols: string[] = [];
  const entries: SymbolEntry[] = [];

  for (const rawTerm of rawTerms) {
    const text = rawTerm.trim();
    if (!text) {
      continue;
    }

    for (const entry of CURATED_SYMBOLS) {
      const matchedAlias = [entry.canonical, ...entry.aliases].find((alias) =>
        includesAlias(text, alias)
      );

      if (matchedAlias) {
        rawSymbols.push(matchedAlias);
        entries.push(entry);
      }
    }
  }

  const normalizedSymbols = dedupe(entries.map((entry) => entry.canonical));
  const tags = dedupe(entries.flatMap((entry) => entry.tags));

  return {
    rawSymbols: dedupe(rawSymbols),
    normalizedSymbols,
    tags,
    entries: dedupe(normalizedSymbols)
      .map((symbol) => entries.find((entry) => entry.canonical === symbol))
      .filter((entry): entry is SymbolEntry => Boolean(entry)),
  };
}

export function expandSymbolTerms(
  symbols: string[],
  options: { includeAliases?: boolean } = {}
): string[] {
  const terms = new Set<string>();

  for (const symbol of symbols) {
    const entry = normalizeSymbolTerm(symbol);
    terms.add(symbol);

    if (entry) {
      terms.add(entry.canonical);

      if (options.includeAliases) {
        for (const alias of entry.aliases) {
          terms.add(alias);
        }
      }
    }
  }

  return dedupe(Array.from(terms));
}

export function getSymbolSearchTerms(
  result: SymbolNormalizationResult
): string[] {
  return expandSymbolTerms(
    [...result.rawSymbols, ...result.normalizedSymbols],
    { includeAliases: true }
  );
}
