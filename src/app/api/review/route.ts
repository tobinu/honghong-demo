import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

/** 对话复盘评价 API */
export async function POST(request: NextRequest) {
  try {
    const { personalityPrompt, scenarioDescription, messages, finalForgiveness, result } =
      await request.json();

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    const systemPrompt = `你是一个恋爱沟通专家，负责复盘一段"哄人"对话，给出专业评价。

角色性格：${personalityPrompt}
情境：${scenarioDescription}
最终原谅值：${finalForgiveness}/100
结果：${result === 'success' ? '成功和好' : '未能和好'}

请分析这段对话，给出评价。要求：
1. 先总结整体表现（1-2句话）
2. 列出2-3个"说得好的地方"（具体指出哪句话好、为什么好）
3. 列出2-3个"说得不好的地方"（具体指出哪句话不好、应该怎么说）
4. 给出一个沟通小贴士
5. 语气友善但专业，像朋友在帮你复盘
6. 严格按以下JSON格式输出，不要其他内容：
{
  "summary": "整体评价",
  "goodPoints": ["好的地方1", "好的地方2"],
  "badPoints": ["不好的地方1", "不好的地方2"],
  "tip": "沟通小贴士"
}`;

    // 构建对话历史摘要
    const conversationSummary = messages
      .map((m: { role: string; content: string }) => `${m.role === 'user' ? '玩家' : '对方'}：${m.content}`)
      .join('\n');

    const llmMessages = [
      { role: 'system' as const, content: systemPrompt },
      {
        role: 'user' as const,
        content: `以下是完整对话记录：\n\n${conversationSummary}\n\n请给出你的复盘评价。`,
      },
    ];

    const response = await client.invoke(llmMessages, {
      model: 'doubao-seed-2-0-lite-260215',
      temperature: 0.7,
    });

    const content = response.content.trim();

    // 尝试解析 JSON
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const review = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ review });
      }
    } catch {
      // JSON 解析失败
    }

    // 兜底返回
    return NextResponse.json({
      review: {
        summary: result === 'success' ? '你成功哄好了对方，沟通能力不错！' : '这次没能哄好，但没关系，沟通是需要练习的。',
        goodPoints: ['愿意主动开口沟通', '表达了诚意'],
        badPoints: ['有些地方还可以更真诚', '有时没有站在对方角度思考'],
        tip: '哄人的关键不是说服对方，而是让对方感受到你的在乎和改变。',
      },
    });
  } catch (error) {
    console.error('Review API error:', error);
    return NextResponse.json({
      review: {
        summary: '复盘生成失败，但重要的是你愿意去尝试沟通。',
        goodPoints: [],
        badPoints: [],
        tip: '真诚永远是哄人最好的武器。',
      },
    });
  }
}
