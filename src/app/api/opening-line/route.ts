import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

/** 为场景生成角色开场白 */
export async function POST(request: NextRequest) {
  try {
    const { personalityPrompt, scenarioDescription } = await request.json();

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    const systemPrompt = `你是恋爱模拟游戏中的女朋友角色。${personalityPrompt}

当前情境：${scenarioDescription}

你刚刚发现这件事，非常生气，要说一句话表达你的愤怒/失望。要求：
1. 必须符合你的角色性格
2. 简短有力，1-2句话
3. 不要加情绪标签
4. 要有代入感，让玩家立刻感受到你在生气`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: '（你刚刚发现了这件事，请说出你的第一反应）' },
    ];

    const response = await client.invoke(messages, {
      model: 'doubao-seed-2-0-lite-260215',
      temperature: 0.9,
    });

    return NextResponse.json({ openingLine: response.content.trim() });
  } catch (error) {
    console.error('Opening line API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate opening line' },
      { status: 500 }
    );
  }
}
