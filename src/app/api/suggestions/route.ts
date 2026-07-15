import { NextRequest, NextResponse } from 'next/server';
import { invoke } from '@/lib/llm';

/**
 * 根据当前对话上下文生成 4 条建议回复
 * 包含1条常见错误回应 + 3条不同策略的回复，随机排列，不做标记
 */
export async function POST(request: NextRequest) {
  try {
    const { personalityPrompt, scenarioDescription, messages, currentForgiveness, currentRound, maxRounds } =
      await request.json();

    // 构建最近的对话上下文（取最后6条消息）
    const recentMessages = messages.slice(-6);
    const contextStr = recentMessages
      .map((m: { role: string; content: string }) => `${m.role === 'user' ? '玩家' : '她'}：${m.content}`)
      .join('\n');

    const lastAssistantMsg = [...messages].reverse().find((m: { role: string }) => m.role === 'assistant');
    const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === 'user');

    const systemPrompt = `你是一个恋爱沟通专家，深谙亲密关系心理学（罗兰·米勒《亲密关系》、戈特曼亲密关系研究、非暴力沟通）。

当前情境：${scenarioDescription}
角色性格：${personalityPrompt}
当前好感度：${currentForgiveness}/100
当前轮次：第${currentRound}/${maxRounds}轮

最近对话：
${contextStr || '（对话刚开始）'}

${lastAssistantMsg ? `她最后说的话：「${lastAssistantMsg.content}」` : ''}
${lastUserMsg ? `玩家上次说的：「${lastUserMsg.content}」` : ''}

请根据她最后说的话，生成4条回复建议。其中1条是常见错误回应，3条是不同策略的有效回应。所有建议随机排列，不做任何标记区分。

**常见错误回应（1条）**：大多数男生的本能反应，看似合理但会火上浇油。常见错误模式：
- 讲道理/辩解（"我又没做错什么""你至于吗""讲道理..."）
- 敷衍式道歉（"好了好了我错了行了吧""我都道歉了你还想怎样"）
- 反向指责（"你总是这样""你怎么这么敏感""你也有问题啊"）
- 冷处理/回避（"随便吧""你想多了""我不想跟你吵"）
- 比较型伤害（"别人女朋友都不这样"）
- 逻辑分析代替情感回应（"我给你分析一下这件事..."）

**有效策略回应（3条）**：三种完全不同的沟通策略，每条必须直接回应她话语中的具体内容：

策略A - 情绪共情：先接住她的情绪，让她感到被理解。关键是用她的原话回应。
  例如她说"你是不是根本不在乎我"，你就回应"你一定觉得我不在乎你了对不对，这种感受我能理解"

策略B - 深层解读：识别她话语背后没说出来的深层需求（通常是被重视、被关注、安全感），直接回应那个需求。
  例如她说"你怎么不回消息"，背后是"我担心你"，你回应"你一定等了很久很担心我，对吗"

策略C - 破局转换：用回忆、承诺、行动或适度幽默来打破负面循环。
  例如"以后我不管在哪，一定先跟你说一声让你放心" 或 "就像上次我们吵架，最后不还是一起去吃了火锅和好了"

规则：
1. 每条15-35字，口语化自然，像真人说话
2. 错误回应必须根据她刚才说的话设计，看起来像"正常人会说的话"而不是明显荒谬
3. 有效回应必须紧扣她话语中的具体关键词和情绪，不能像万能模板
4. 4条建议随机排列，不做❌✅标记，不要加序号暗示对错
5. 好感度低时（<30），策略偏共情和深层解读，避免轻浮幽默
6. 好感度中等时（30-60），可以尝试行动承诺或回忆甜蜜
7. 好感度高时（>60），可以适度甜蜜或幽默

严格按JSON数组格式输出4条，格式：["回复1","回复2","回复3","回复4"]`;

    const llmMessages = [
      { role: 'system' as const, content: systemPrompt },
      {
        role: 'user' as const,
        content: lastAssistantMsg
          ? `她刚说了「${lastAssistantMsg.content}」，我该怎么回复？给我4个选项`
          : '对话刚开始，给我4个开场回复建议',
      },
    ];

    const response = await invoke(llmMessages, { temperature: 0.9 });

    const content = response.content.trim();

    // 尝试解析 JSON 数组
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0]);
        if (Array.isArray(suggestions) && suggestions.length > 0) {
          // 清理标记并随机排列
          const cleaned = suggestions
            .slice(0, 4)
            .map((s: unknown) => String(s).trim().replace(/^[❌✅⚠💡]\s*/, ''));
          // Fisher-Yates shuffle
          for (let i = cleaned.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cleaned[i], cleaned[j]] = [cleaned[j], cleaned[i]];
          }
          return NextResponse.json({ suggestions: cleaned });
        }
      }
    } catch {
      // JSON 解析失败，尝试按行分割
    }

    // 兜底：按换行分割
    const lines = content
      .split('\n')
      .map((l: string) => l.replace(/^[\d\.\-\*]+\s*/, '').replace(/^[❌✅⚠💡]\s*/, '').trim())
      .filter((l: string) => l.length > 0 && l.length < 80);

    return NextResponse.json({
      suggestions: lines.slice(0, 4).length > 0 ? lines.slice(0, 4) : [
        '你至于这么生气吗',
        '我知道刚才我说话太冲了，让你难过了',
        '你是不是觉得我根本不在乎你的感受？',
        '以后我一定提前跟你说，不让你再担心了',
      ],
    });
  } catch (error) {
    console.error('Suggestions API error:', error);
    return NextResponse.json({
      suggestions: [
        '好了好了我错了行了吧',
        '我知道你现在很生气，换作是我也会这样',
        '你能不能告诉我你最在意的是什么？',
        '以后这种事我一定不会再犯了',
      ],
    });
  }
}