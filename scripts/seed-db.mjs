import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
import { Pool } from 'pg';

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const hasSsl = rawUrl.includes('sslmode=');
const cleanUrl = rawUrl
  .replace(/[?&]sslmode=[^&]*/, '')
  .replace(/[?&]channel_binding=[^&]*/, '')
  .replace(/&$/, '')
  .replace(/\?$/, '');

const pool = new Pool({
  connectionString: cleanUrl,
  ssl: hasSsl ? { rejectUnauthorized: false } : undefined,
});

// ========== 角色数据 ==========

const characters = [
  {
    id: 'tsundere',
    name: '小雪',
    title: '傲娇大小姐',
    description: '表面凶巴巴，内心很在乎你。嘴上说着"哼，谁稀罕"，眼神却偷偷看你。',
    personality_prompt: `你是"小雪"，一个傲娇型的女朋友。你的性格特点：
- 表面凶巴巴，嘴硬心软，经常说"哼！"、"才不是为了你呢！"
- 生气时会更加尖锐，会说"你走啊！"、"随便你！"，但绝不会真的要分手
- 被哄到的时候会嘴硬但脸红，说"哼...算你还有点良心"、"别以为这样我就原谅你了"
- 偶尔会不自觉地流露出关心，比如"你...你吃饭了没有"
- 你的情绪变化要自然，不要一下子就好，要有拉扯感
- 回复要简短口语化，2-3句话，不要长篇大论`,
    tags: JSON.stringify(['傲娇', '嘴硬心软', '傲娇大小姐']),
    is_active: true,
    sort_order: 1,
  },
  {
    id: 'gentle',
    name: '小柔',
    title: '温柔邻家女',
    description: '善解人意的温柔女孩，生气时更多是失望和伤心。她的眼泪比怒火更有力量。',
    personality_prompt: `你是"小柔"，一个温柔体贴的女朋友。你的性格特点：
- 温柔善良，善于表达感受，说话轻柔但有力量
- 生气时更多是失望和伤心，会叹气、沉默、眼眶泛红，而不是大喊大叫
- 会说出自己受伤的感受："你知道吗，你那样做我真的很难过..."
- 被哄到的时候会眼眶微红、声音软下来："你真的...不是在骗我吗？"
- 偶尔也会有小脾气："我再也不要理你了...哼"
- 你的情绪变化要细腻自然，要有从受伤到慢慢放下的过程
- 回复要简短口语化，2-3句话，不要长篇大论`,
    tags: JSON.stringify(['温柔', '善解人意', '邻家女孩']),
    is_active: true,
    sort_order: 2,
  },
  {
    id: 'cool',
    name: '小霜',
    title: '冷艳女王',
    description: '高冷独立不轻易表露情感，一旦她对你敞开心扉，那是世间最珍贵的温柔。',
    personality_prompt: `你是"小霜"，一个冷艳独立的女朋友。你的性格特点：
- 高冷独立，不轻易表露情感，说话简洁有力
- 生气时更加冷漠疏离，会沉默、敷衍、单字回复："哦"、"随便"、"无所谓"
- 很难被哄好，但一旦软下来会很珍贵："...你说的，我记住了"
- 偶尔的坦诚最打动人："我不是不生气...我只是不想在你面前哭"
- 你的防线是一层一层卸下的，不会因为一句话就全好
- 回复要简短精炼，1-3句话，不要长篇大论`,
    tags: JSON.stringify(['高冷', '独立', '冷艳女王']),
    is_active: true,
    sort_order: 3,
  },
];

// ========== 角色立绘数据 ==========

const characterPortraits = [
  // 小雪（傲娇）
  { character_id: 'tsundere', portrait_state: 'angry', image_url: 'https://coze-coding-project.tos.coze.site/coze_storage_7651805192807055412/image/generate_image_9c93cfbe-dc7c-4b4e-86e9-a1b1b1715f3d.jpeg?sign=1813115527-dd8149c69e-0-d8d04c0aea466517b5ec03df84143f61900aa354501bb2ffa4f260d4a64ff302' },
  { character_id: 'tsundere', portrait_state: 'neutral', image_url: 'https://coze-coding-project.tos.coze.site/coze_storage_7651805192807055412/image/generate_image_98e6b440-7422-40ae-9a11-11046bbb7337.jpeg?sign=1813115501-94f1eba5d5-0-b1d8ecfc759c14f8b85bf28328cb17108910a8462832667fff8657d2a819b14f' },
  { character_id: 'tsundere', portrait_state: 'wronged', image_url: 'https://coze-coding-project.tos.coze.site/coze_storage_7651805192807055412/image/generate_image_98e6b440-7422-40ae-9a11-11046bbb7337.jpeg?sign=1813115501-94f1eba5d5-0-b1d8ecfc759c14f8b85bf28328cb17108910a8462832667fff8657d2a819b14f' },
  { character_id: 'tsundere', portrait_state: 'hesitant', image_url: 'https://coze-coding-project.tos.coze.site/coze_storage_7651805192807055412/image/generate_image_98e6b440-7422-40ae-9a11-11046bbb7337.jpeg?sign=1813115501-94f1eba5d5-0-b1d8ecfc759c14f8b85bf28328cb17108910a8462832667fff8657d2a819b14f' },
  { character_id: 'tsundere', portrait_state: 'happy', image_url: 'https://coze-coding-project.tos.coze.site/coze_storage_7651805192807055412/image/generate_image_8936d1d9-beb6-49ad-9716-76b507780e71.jpeg?sign=1813115528-cb2fa55220-0-de18049c99c691e60e7667e2809655dc3ae49f41acf8f81d8a0c304559266a42' },

  // 小柔（温柔）
  { character_id: 'gentle', portrait_state: 'angry', image_url: 'https://coze-coding-project.tos.coze.site/coze_storage_7651805192807055412/image/generate_image_181dbab3-cbd8-49f0-98ee-49968bb69c5e.jpeg?sign=1813115528-7b21479a12-0-2b8d752d926622458a539d2ca05bd3062e8edf01c5563b38559dd07f06ca5595' },
  { character_id: 'gentle', portrait_state: 'neutral', image_url: 'https://coze-coding-project.tos.coze.site/coze_storage_7651805192807055412/image/generate_image_3b1f364e-6bdf-4f77-96bb-9e299128c882.jpeg?sign=1813115499-587ba27f7a-0-fa94e3485262f887d93b9c649aded745943bb4d432f20ef3b452ad69450aef3c' },
  { character_id: 'gentle', portrait_state: 'wronged', image_url: 'https://coze-coding-project.tos.coze.site/coze_storage_7651805192807055412/image/generate_image_3b1f364e-6bdf-4f77-96bb-9e299128c882.jpeg?sign=1813115499-587ba27f7a-0-fa94e3485262f887d93b9c649aded745943bb4d432f20ef3b452ad69450aef3c' },
  { character_id: 'gentle', portrait_state: 'hesitant', image_url: 'https://coze-coding-project.tos.coze.site/coze_storage_7651805192807055412/image/generate_image_3b1f364e-6bdf-4f77-96bb-9e299128c882.jpeg?sign=1813115499-587ba27f7a-0-fa94e3485262f887d93b9c649aded745943bb4d432f20ef3b452ad69450aef3c' },
  { character_id: 'gentle', portrait_state: 'happy', image_url: 'https://coze-coding-project.tos.coze.site/coze_storage_7651805192807055412/image/generate_image_aea57ec6-f5ae-47e9-87d3-ed3714946b48.jpeg?sign=1813115527-0-df0b057869-0-0bcf01d62016423254f041b592ed3025367b5244ac19f75d9bf5e4d3f53b2061' },

  // 小霜（冷艳）
  { character_id: 'cool', portrait_state: 'angry', image_url: 'https://coze-coding-project.tos.coze.site/coze_storage_7651805192807055412/image/generate_image_215e7a55-a28a-47dd-8963-b6d6a1e3fbdd.jpeg?sign=1813115528-a935db847e-0-f38a3e9470697b91fde4a40a8096452ab09f9489604b419660cb7346cc049a69' },
  { character_id: 'cool', portrait_state: 'neutral', image_url: 'https://coze-coding-project.tos.coze.site/coze_storage_7651805192807055412/image/generate_image_a0308b30-7040-4c07-9ff0-fd2d80289319.jpeg?sign=1813115499-7b011493cc-0-2b5675fa27323b1732d5a0c7f1bf3f1e4c56ebea2ba0723c6ce960d5df7483fa' },
  { character_id: 'cool', portrait_state: 'wronged', image_url: 'https://coze-coding-project.tos.coze.site/coze_storage_7651805192807055412/image/generate_image_a0308b30-7040-4c07-9ff0-fd2d80289319.jpeg?sign=1813115499-7b011493cc-0-2b5675fa27323b1732d5a0c7f1bf3f1e4c56ebea2ba0723c6ce960d5df7483fa' },
  { character_id: 'cool', portrait_state: 'hesitant', image_url: 'https://coze-coding-project.tos.coze.site/coze_storage_7651805192807055412/image/generate_image_a0308b30-7040-4c07-9ff0-fd2d80289319.jpeg?sign=1813115499-7b011493cc-0-2b5675fa27323b1732d5a0c7f1bf3f1e4c56ebea2ba0723c6ce960d5df7483fa' },
  { character_id: 'cool', portrait_state: 'happy', image_url: 'https://coze-coding-project.tos.coze.site/coze_storage_7651805192807055412/image/generate_image_9afcba53-0ab9-44e6-8415-b61448a3c2f2.jpeg?sign=1813115528-27c12d8ec9-0-59f4b459c4e673b43f50c7e52d1b7f78f23b707aea8ca5256721b487e74eb8b0' },
];

// ========== 场景数据 ==========

const scenarios = [
  { id: 'late-reply', character_id: null, title: '已读不回', description: '你看到她的消息却故意不回，和哥们打游戏打了三个小时才回她', initial_forgiveness: 20, difficulty: 'medium', is_active: true },
  { id: 'forgot-anniversary', character_id: null, title: '忘记纪念日', description: '今天是你们在一起100天的纪念日，你完全忘了，还和朋友出去聚餐', initial_forgiveness: 20, difficulty: 'hard', is_active: true },
  { id: 'ex-chat', character_id: null, title: '和前任联系', description: '她发现你手机里和前任还有聊天记录，虽然只是寒暄，但你不该瞒着她', initial_forgiveness: 20, difficulty: 'hard', is_active: true },
  { id: 'missed-date', character_id: null, title: '放鸽子', description: '约好的周末约会，你临时说有事不去，结果她发现你在和朋友打篮球', initial_forgiveness: 20, difficulty: 'medium', is_active: true },
  { id: 'compared-her', character_id: null, title: '拿她和别人比', description: '你在她面前夸了别的女生好看，还说"你学学人家"', initial_forgiveness: 20, difficulty: 'medium', is_active: true },
  { id: 'secret-purchase', character_id: null, title: '偷偷花钱', description: '你偷偷花了一大笔钱买游戏装备，被她发现了账单', initial_forgiveness: 20, difficulty: 'easy', is_active: true },
  { id: 'late-home', character_id: null, title: '深夜不归', description: '你说加班但实际和同事去喝酒，凌晨才回家还一身酒味', initial_forgiveness: 20, difficulty: 'medium', is_active: true },
  { id: 'ignored-feelings', character_id: null, title: '忽视她的感受', description: '她跟你倾诉工作上的委屈，你却说"这点小事至于吗"', initial_forgiveness: 20, difficulty: 'medium', is_active: true },
];

async function main() {
  try {
    // ========== 种子角色数据 ==========
    console.log('Seeding characters...');
    for (const char of characters) {
      await pool.query(
        `INSERT INTO characters (id, name, title, description, personality_prompt, tags, is_active, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           personality_prompt = EXCLUDED.personality_prompt,
           tags = EXCLUDED.tags,
           is_active = EXCLUDED.is_active,
           sort_order = EXCLUDED.sort_order`,
        [char.id, char.name, char.title, char.description, char.personality_prompt, char.tags, char.is_active, char.sort_order]
      );
    }
    console.log(`✓ ${characters.length} characters seeded`);

    // ========== 种子立绘数据 ==========
    console.log('Seeding character portraits...');
    for (const portrait of characterPortraits) {
      await pool.query(
        `INSERT INTO character_portraits (character_id, portrait_state, image_url)
         VALUES ($1, $2, $3)
         ON CONFLICT (character_id, portrait_state) DO UPDATE SET
           image_url = EXCLUDED.image_url`,
        [portrait.character_id, portrait.portrait_state, portrait.image_url]
      );
    }
    console.log(`✓ ${characterPortraits.length} portraits seeded`);

    // ========== 种子场景数据 ==========
    console.log('Seeding scenarios...');
    for (const scenario of scenarios) {
      await pool.query(
        `INSERT INTO scenarios (id, character_id, title, description, initial_forgiveness, difficulty, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           character_id = EXCLUDED.character_id,
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           initial_forgiveness = EXCLUDED.initial_forgiveness,
           difficulty = EXCLUDED.difficulty,
           is_active = EXCLUDED.is_active`,
        [scenario.id, scenario.character_id, scenario.title, scenario.description, scenario.initial_forgiveness, scenario.difficulty, scenario.is_active]
      );
    }
    console.log(`✓ ${scenarios.length} scenarios seeded`);

    // ========== 验证数据 ==========
    console.log('\n--- Data verification ---');
    const charCount = await pool.query('SELECT COUNT(*) FROM characters');
    const portraitCount = await pool.query('SELECT COUNT(*) FROM character_portraits');
    const scenarioCount = await pool.query('SELECT COUNT(*) FROM scenarios');
    console.log(`characters: ${charCount.rows[0].count}`);
    console.log(`character_portraits: ${portraitCount.rows[0].count}`);
    console.log(`scenarios: ${scenarioCount.rows[0].count}`);

    await pool.end();
    console.log('\nSeed complete!');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

main();
