import { NextRequest, NextResponse } from 'next/server';
import { streamIterator } from '@/lib/llm';
import type { ChatRequest, Emotion } from '@/lib/types';
import { EMOTION_DELTAS } from '@/lib/game-data';

/** 从 LLM 回复中解析情绪标签，格式: [EMOTION:xxx] */
function parseEmotionTag(text: string): { cleanText: string; emotion: Emotion; delta: number } {
  const emotionRegex = /\[EMOTION:(angry|wronged|hesitant|touched|happy)\]/;
  const match = text.match(emotionRegex);

  if (match) {
    const emotion = match[1] as Emotion;
    const cleanText = text.replace(emotionRegex, '').trim();
    const deltaRange = EMOTION_DELTAS[emotion];
    const delta = Math.floor(
      Math.random() * (deltaRange.max - deltaRange.min + 1) + deltaRange.min
    );
    return { cleanText, emotion, delta };
  }

  // 如果没有情绪标签，默认 wronged
  const deltaRange = EMOTION_DELTAS.wronged;
  const delta = Math.floor(
    Math.random() * (deltaRange.max - deltaRange.min + 1) + deltaRange.min
  );
  return { cleanText: text, emotion: 'wronged', delta };
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const {
      personalityPrompt,
      scenarioDescription,
      messages,
      userMessage,
      currentForgiveness,
      currentRound,
      maxRounds,
    } = body;

    // 构建系统提示
    const systemPrompt = `你是一个恋爱模拟游戏中的女朋友角色。${personalityPrompt}

当前情境：${scenarioDescription}

当前原谅值：${currentForgiveness}/100（60以上代表原谅你了）
当前轮次：第${currentRound}/${maxRounds}轮

重要规则：
1. 你必须根据玩家的回复来判断你的情绪变化，并在回复最后附上情绪标签
2. 情绪标签格式：[EMOTION:xxx]，其中xxx必须是以下之一：
   - angry（玩家说了很过分的话，你更加生气了）
   - wronged（玩家的话让你觉得委屈，没太大变化）
   - hesitant（你有点动摇了，但还没完全原谅）
   - touched（玩家说到了你心坎上，你很感动）
   - happy（玩家表现太好了，你几乎要原谅他了）
3. 根据当前原谅值调整你的态度：
   - 低于20：非常生气，几乎不给你好脸色
   - 20-40：还在生气，但态度稍微缓和
   - 40-60：犹豫期，有时心软有时又生气
   - 60-80：基本原谅了，但还会撒娇
   - 80以上：完全和好，甜蜜模式
4. 回复必须简短口语化，1-3句话
5. 情绪标签必须放在回复最末尾
6. 不要提及"原谅值"、"轮次"等游戏机制`;

    const llmMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: userMessage },
    ];

    // 使用新的 LLM 适配层
    const stream = streamIterator(llmMessages, { temperature: 0.8 });

    // 创建 SSE 流
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        let fullText = '';
        try {
          for await (const chunk of stream) {
            fullText += chunk;
            // 发送文本块
            const data = JSON.stringify({ type: 'text', content: chunk });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          // 流结束后，解析情绪标签
          const { cleanText, emotion, delta } = parseEmotionTag(fullText);

          // 发送情绪标签
          const emotionData = JSON.stringify({
            type: 'emotion',
            emotion,
            delta,
            cleanText,
          });
          controller.enqueue(encoder.encode(`data: ${emotionData}\n\n`));

          // 发送结束信号
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          const errorData = JSON.stringify({
            type: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}