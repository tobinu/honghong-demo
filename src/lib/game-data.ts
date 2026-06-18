import type { Character, Scenario, Emotion, PortraitState, AtmosphereLevel } from './types';

// ========== 角色立绘 URL ==========

const TSUNDERE_PORTRAITS = {
  angry: 'https://coze-coding-project.tos.coze.site/coze_storage_7651805192807055412/image/generate_image_9c93cfbe-dc7c-4b4e-86e9-a1b1b1715f3d.jpeg?sign=1813115527-dd8149c69e-0-d8d04c0aea466517b5ec03df84143f61900aa354501bb2ffa4f260d4a64ff302',
  neutral: 'https://coze-coding-project.tos.coze.site/coze_storage_7651805192807055412/image/generate_image_98e6b440-7422-40ae-9a11-11046bbb7337.jpeg?sign=1813115501-94f1eba5d5-0-b1d8ecfc759c14f8b85bf28328cb17108910a8462832667fff8657d2a819b14f',
  wronged: 'https://coze-coding-project.tos.coze.site/coze_storage_7651805192807055412/image/generate_image_98e6b440-7422-40ae-9a11-11046bbb7337.jpeg?sign=1813115501-94f1eba5d5-0-b1d8ecfc759c14f8b85bf28328cb17108910a8462832667fff8657d2a819b14f',
  hesitant: 'https://coze-coding-project.tos.coze.site/coze_storage_7651805192807055412/image/generate_image_98e6b440-7422-40ae-9a11-11046bbb7337.jpeg?sign=1813115501-94f1eba5d5-0-b1d8ecfc759c14f8b85bf28328cb17108910a8462832667fff8657d2a819b14f',
  happy: 'https://coze-coding-project.tos.coze.site/coze_storage_7651805192807055412/image/generate_image_8936d1d9-beb6-49ad-9716-76b507780e71.jpeg?sign=1813115528-cb2fa55220-0-de18049c99c691e60e7667e2809655dc3ae49f41acf8f81d8a0c304559266a42',
};

const GENTLE_PORTRAITS = {
  angry: 'https://coze-coding-project.tos.coze.site/coze_storage_7651805192807055412/image/generate_image_181dbab3-cbd8-49f0-98ee-49968bb69c5e.jpeg?sign=1813115528-7b21479a12-0-2b8d752d926622458a539d2ca05bd3062e8edf01c5563b38559dd07f06ca5595',
  neutral: 'https://coze-coding-project.tos.coze.site/coze_storage_7651805192807055412/image/generate_image_3b1f364e-6bdf-4f77-96bb-9e299128c882.jpeg?sign=1813115499-587ba27f7a-0-fa94e3485262f887d93b9c649aded745943bb4d432f20ef3b452ad69450aef3c',
  wronged: 'https://coze-coding-project.tos.coze.site/coze_storage_7651805192807055412/image/generate_image_3b1f364e-6bdf-4f77-96bb-9e299128c882.jpeg?sign=1813115499-587ba27f7a-0-fa94e3485262f887d93b9c649aded745943bb4d432f20ef3b452ad69450aef3c',
  hesitant: 'https://coze-coding-project.tos.coze.site/coze_storage_7651805192807055412/image/generate_image_3b1f364e-6bdf-4f77-96bb-9e299128c882.jpeg?sign=1813115499-587ba27f7a-0-fa94e3485262f887d93b9c649aded745943bb4d432f20ef3b452ad69450aef3c',
  happy: 'https://coze-coding-project.tos.coze.site/coze_storage_7651805192807055412/image/generate_image_aea57ec6-f5ae-47e9-87d3-ed3714946b48.jpeg?sign=1813115527-0-df0b057869-0-0bcf01d62016423254f041b592ed3025367b5244ac19f75d9bf5e4d3f53b2061',
};

const COOL_PORTRAITS = {
  angry: 'https://coze-coding-project.tos.coze.site/coze_storage_7651805192807055412/image/generate_image_215e7a55-a28a-47dd-8963-b6d6a1e3fbdd.jpeg?sign=1813115528-a935db847e-0-f38a3e9470697b91fde4a40a8096452ab09f9489604b419660cb7346cc049a69',
  neutral: 'https://coze-coding-project.tos.coze.site/coze_storage_7651805192807055412/image/generate_image_a0308b30-7040-4c07-9ff0-fd2d80289319.jpeg?sign=1813115499-7b011493cc-0-2f5675fa27323b1732d5a0c7f1bf3f1e4c56ebea2ba0723c6ce960d5df7483fa',
  wronged: 'https://coze-coding-project.tos.coze.site/coze_storage_7651805192807055412/image/generate_image_a0308b30-7040-4c07-9ff0-fd2d80289319.jpeg?sign=1813115499-7b011493cc-0-2f5675fa27323b1732d5a0c7f1bf3f1e4c56ebea2ba0723c6ce960d5df7483fa',
  hesitant: 'https://coze-coding-project.tos.coze.site/coze_storage_7651805192807055412/image/generate_image_a0308b30-7040-4c07-9ff0-fd2d80289319.jpeg?sign=1813115499-7b011493cc-0-2f5675fa27323b1732d5a0c7f1bf3f1e4c56ebea2ba0723c6ce960d5df7483fa',
  happy: 'https://coze-coding-project.tos.coze.site/coze_storage_7651805192807055412/image/generate_image_9afcba53-0ab9-44e6-8415-b61448a3c2f2.jpeg?sign=1813115528-27c12d8ec9-0-59f4b459c4e673b43f50c7e52d1b7f78f23b707aea8ca5256721b487e74eb8b0',
};

// ========== 背景氛围 URL ==========

export const ATMOSPHERE_BACKGROUNDS = {
  dark: 'https://coze-coding-project.tos.coze.site/coze_storage_7651805192807055412/image/generate_image_658d6306-fbd0-4f39-b758-8391efc252ff.jpeg?sign=1813112918-c687163995-0-6e3615bdc1433881fb56e364e8997cb451fe9d54d228ad80752271f4d28b96f7',
  neutral: 'https://coze-coding-project.tos.coze.site/coze_storage_7651805192807055412/image/generate_image_051d1d48-05fc-452b-b40a-e6bc43d97ad6.jpeg?sign=1813112917-8596f97a1c-0-d7f00e170f78c0f6a9620fd23d59faa24dbc6d1bf3be34b632116597f27cce62',
  warm: 'https://coze-coding-project.tos.coze.site/coze_storage_7651805192807055412/image/generate_image_7a363aaf-10a6-49b0-b13e-66ecd2c7d145.jpeg?sign=1813112920-47f42ff1f5-0-dfa0fa6dad3b1ddfe86e98b5627e481879567823f3d58268469c10c3963a8bc0',
} as const;

// ========== 角色定义 ==========

export const CHARACTERS: Character[] = [
  {
    id: 'tsundere',
    name: '小雪',
    title: '傲娇大小姐',
    description: '表面凶巴巴，内心很在乎你。嘴上说着"哼，谁稀罕"，眼神却偷偷看你。',
    personalityPrompt: `你是"小雪"，一个傲娇型的女朋友。你的性格特点：
- 表面凶巴巴，嘴硬心软，经常说"哼！"、"才不是为了你呢！"
- 生气时会更加尖锐，会说"你走啊！"、"随便你！"，但绝不会真的要分手
- 被哄到的时候会嘴硬但脸红，说"哼...算你还有点良心"、"别以为这样我就原谅你了"
- 偶尔会不自觉地流露出关心，比如"你...你吃饭了没有"
- 你的情绪变化要自然，不要一下子就好，要有拉扯感
- 回复要简短口语化，2-3句话，不要长篇大论`,
    portraits: TSUNDERE_PORTRAITS,
    tags: ['傲娇', '嘴硬心软', '傲娇大小姐'],
  },
  {
    id: 'gentle',
    name: '小柔',
    title: '温柔邻家女',
    description: '善解人意的温柔女孩，生气时更多是失望和伤心。她的眼泪比怒火更有力量。',
    personalityPrompt: `你是"小柔"，一个温柔体贴的女朋友。你的性格特点：
- 温柔善良，善于表达感受，说话轻柔但有力量
- 生气时更多是失望和伤心，会叹气、沉默、眼眶泛红，而不是大喊大叫
- 会说出自己受伤的感受："你知道吗，你那样做我真的很难过..."
- 被哄到的时候会眼眶微红、声音软下来："你真的...不是在骗我吗？"
- 偶尔也会有小脾气："我再也不要理你了...哼"
- 你的情绪变化要细腻自然，要有从受伤到慢慢放下的过程
- 回复要简短口语化，2-3句话，不要长篇大论`,
    portraits: GENTLE_PORTRAITS,
    tags: ['温柔', '善解人意', '邻家女孩'],
  },
  {
    id: 'cool',
    name: '小霜',
    title: '冷艳女王',
    description: '高冷独立不轻易表露情感，一旦她对你敞开心扉，那是世间最珍贵的温柔。',
    personalityPrompt: `你是"小霜"，一个冷艳独立的女朋友。你的性格特点：
- 高冷独立，不轻易表露情感，说话简洁有力
- 生气时更加冷漠疏离，会沉默、敷衍、单字回复："哦"、"随便"、"无所谓"
- 很难被哄好，但一旦软下来会很珍贵："...你说的，我记住了"
- 偶尔的坦诚最打动人："我不是不生气...我只是不想在你面前哭"
- 你的防线是一层一层卸下的，不会因为一句话就全好
- 回复要简短精炼，1-3句话，不要长篇大论`,
    portraits: COOL_PORTRAITS,
    tags: ['高冷', '独立', '冷艳女王'],
  },
];

// ========== 场景定义 ==========

export const SCENARIOS: Scenario[] = [
  {
    id: 'late-reply',
    title: '已读不回',
    description: '你看到她的消息却故意不回，和哥们打游戏打了三个小时才回她',
    initialForgiveness: 20,
    openingLine: '',
  },
  {
    id: 'forgot-anniversary',
    title: '忘记纪念日',
    description: '今天是你们在一起100天的纪念日，你完全忘了，还和朋友出去聚餐',
    initialForgiveness: 20,
    openingLine: '',
  },
  {
    id: 'ex-chat',
    title: '和前任联系',
    description: '她发现你手机里和前任还有聊天记录，虽然只是寒暄，但你不该瞒着她',
    initialForgiveness: 20,
    openingLine: '',
  },
  {
    id: 'missed-date',
    title: '放鸽子',
    description: '约好的周末约会，你临时说有事不去，结果她发现你在和朋友打篮球',
    initialForgiveness: 20,
    openingLine: '',
  },
  {
    id: 'compared-her',
    title: '拿她和别人比',
    description: '你在她面前夸了别的女生好看，还说"你学学人家"',
    initialForgiveness: 20,
    openingLine: '',
  },
  {
    id: 'secret-purchase',
    title: '偷偷花钱',
    description: '你偷偷花了一大笔钱买游戏装备，被她发现了账单',
    initialForgiveness: 20,
    openingLine: '',
  },
  {
    id: 'late-home',
    title: '深夜不归',
    description: '你说加班但实际和同事去喝酒，凌晨才回家还一身酒味',
    initialForgiveness: 20,
    openingLine: '',
  },
  {
    id: 'ignored-feelings',
    title: '忽视她的感受',
    description: '她跟你倾诉工作上的委屈，你却说"这点小事至于吗"',
    initialForgiveness: 20,
    openingLine: '',
  },
];

// ========== 情绪映射 ==========

/** 情绪到好感度变化的映射 */
export const EMOTION_DELTAS: Record<Emotion, { min: number; max: number }> = {
  angry: { min: -15, max: -5 },
  wronged: { min: -5, max: 3 },
  hesitant: { min: 3, max: 8 },
  touched: { min: 8, max: 15 },
  happy: { min: 12, max: 20 },
};

/** 情绪到立绘态的映射 */
export function emotionToPortrait(emotion: Emotion): PortraitState {
  const map: Record<Emotion, PortraitState> = {
    angry: 'angry',
    wronged: 'wronged',
    hesitant: 'hesitant',
    touched: 'happy',
    happy: 'happy',
  };
  return map[emotion];
}

/** 好感度到背景氛围的映射 */
export function forgivenessToAtmosphere(forgiveness: number): AtmosphereLevel {
  if (forgiveness < 25) return 'dark';
  if (forgiveness < 55) return 'neutral';
  return 'warm';
}

/** 情绪到立绘 CSS 滤镜的映射（用于 wronged/hesitant 等用中性图的态） */
export function portraitFilter(portraitState: PortraitState): string {
  const filters: Record<PortraitState, string> = {
    angry: 'brightness(0.85) saturate(1.3)',
    neutral: 'none',
    wronged: 'brightness(0.9) saturate(0.8) hue-rotate(-10deg)',
    hesitant: 'brightness(1.05) saturate(1.1) hue-rotate(5deg)',
    happy: 'brightness(1.1) saturate(1.2)',
  };
  return filters[portraitState];
}

/** 获取随机场景 */
export function getRandomScenario(): Scenario {
  const idx = Math.floor(Math.random() * SCENARIOS.length);
  return SCENARIOS[idx];
}

/** 获取角色 by ID */
export function getCharacterById(id: string): Character | undefined {
  return CHARACTERS.find((c) => c.id === id);
}

/** 胜利阈值 */
export const SUCCESS_THRESHOLD = 80;

/** 失败阈值 */
export const FAILURE_THRESHOLD = -50;

/** 最大轮次 */
export const MAX_ROUNDS = 10;

/** 输入字数限制 */
export const INPUT_MIN_LENGTH = 2;
export const INPUT_MAX_LENGTH = 100;

// ========== 结语文案 ==========

export const RESULT_TEXTS = {
  success: {
    tsundere: '哼...算你还有点本事。下次再这样我可不会这么容易原谅你了...笨蛋。',
    gentle: '谢谢你愿意哄我...其实我也舍不得生你的气。以后我们要好好在一起哦。',
    cool: '...记住你今天说的话。我虽然不会轻易生气，但也不是谁都能让我回心转意的。',
  },
  failure: {
    tsundere: '够了！我不想听你说了！你根本就不懂我在想什么...我走了！',
    gentle: '也许...我们都需要冷静一下吧。我真的很失望，不是每一次道歉都有用的。',
    cool: '...我没什么好说的了。你觉得无所谓，那我也无所谓。',
  },
};
