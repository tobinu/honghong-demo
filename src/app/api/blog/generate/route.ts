import { NextRequest, NextResponse } from 'next/server';
import { streamIterator } from '@/lib/llm';
import { getDb, schema } from '@/lib/db';

const TOPICS = [
  '异地恋怎么维持安全感',
  '吵架时如何正确表达自己的感受',
  '如何判断对方是在撒娇还是真生气',
  '冷战比吵架更伤人，为什么',
  '怎样在恋爱中保持自我',
  '为什么女生总爱问"你爱不爱我"',
  '恋爱中的安全感到底从哪来',
  '如何处理前任相关的话题',
  '为什么「多喝热水」是一句废话',
  '如何区分关心和控制',
  '恋爱中的边界感怎么建立',
  '怎样做到既温柔又有底线',
  '如何用幽默化解恋爱中的尴尬',
  '为什么说倾听比建议更重要',
  '恋爱中的仪式感有多重要',
];

function generateSlug(title: string): string {
  const slugMap: Record<string, string> = {
    '吵架之后的黄金 30 分钟': 'golden-30-minutes',
    '为什么「你说得对」是最烂的回复': 'worst-reply',
    '道歉的正确打开方式': 'how-to-apologize',
  };

  if (slugMap[title]) return slugMap[title];

  const sanitized = title
    .replace(/[「」【】]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5-]/g, '')
    .slice(0, 50);

  const timestamp = Date.now().toString(36);
  return `${sanitized}-${timestamp}`;
}

export async function POST(request: NextRequest) {
  try {
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];

    const messages = [
      {
        role: 'system' as const,
        content: `你是一位恋爱沟通技巧专栏作者，风格轻松幽默、接地气，像闺蜜/兄弟聊天一样。你的读者是 18-25 岁的年轻人，他们正在学习如何更好地与伴侣沟通。

要求：
1. 写一篇关于指定主题的文章，300-500字
2. 语言要口语化、有趣、有画面感，避免学术腔
3. 要有实际可操作的建议，不能只讲大道理
4. 可以用生活场景举例，让读者有代入感
5. 输出格式必须是合法 JSON：
{
  "title": "文章标题（有吸引力，15字以内）",
  "summary": "文章摘要（50字以内，吸引人点进来看）",
  "content": "文章正文（300-500字，段落间用\\n\\n分隔）"
}
6. 只输出 JSON，不要输出其他内容`,
      },
      {
        role: 'user' as const,
        content: `请写一篇关于「${topic}」的恋爱沟通技巧文章。`,
      },
    ];

    let fullText = '';
    const stream = streamIterator(messages, { temperature: 0.9 });

    for await (const chunk of stream) {
      fullText += chunk;
    }

    let jsonStr = fullText.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    let articleData: { title: string; summary: string; content: string };
    try {
      articleData = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json(
        { error: 'LLM 返回的内容无法解析为 JSON', raw: fullText },
        { status: 500 }
      );
    }

    const { title, summary, content } = articleData;

    if (!title || !summary || !content) {
      return NextResponse.json(
        { error: '文章数据不完整', data: articleData },
        { status: 500 }
      );
    }

    const db = getDb();
    const slug = generateSlug(title);

    try {
      const inserted = await db
        .insert(schema.blogPosts)
        .values({ slug, title, summary, content })
        .returning();

      const post = {
        id: inserted[0].id,
        title: inserted[0].title,
        slug: inserted[0].slug,
        summary: inserted[0].summary,
        content: inserted[0].content,
        createdAt: inserted[0].createdAt,
      };

      return NextResponse.json({ post, topic });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : '';
      if (errMsg.includes('duplicate') || errMsg.includes('唯一') || errMsg.includes('slug')) {
        const uniqueSlug = `${slug}-${Date.now()}`;
        const retry = await db
          .insert(schema.blogPosts)
          .values({ slug: uniqueSlug, title, summary, content })
          .returning();

        const post = {
          id: retry[0].id,
          title: retry[0].title,
          slug: retry[0].slug,
          summary: retry[0].summary,
          content: retry[0].content,
          createdAt: retry[0].createdAt,
        };
        return NextResponse.json({ post, topic });
      }
      throw new Error(`保存文章失败: ${errMsg}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : '生成文章失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}