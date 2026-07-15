/**
 * LLM 统一适配层
 * 封装火山引擎 API（OpenAI 兼容格式）
 */

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  content: string;
}

/** 获取配置 */
function getConfig() {
  const apiKey = process.env.VOLC_API_KEY;
  const baseUrl = process.env.VOLC_API_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
  const model = process.env.VOLC_MODEL || 'deepseek-v4-flash-260425';

  if (!apiKey) {
    throw new Error('VOLC_API_KEY is not set in environment variables');
  }

  return { apiKey, baseUrl, model };
}

/** 错误处理 */
function handleError(status: number, message: string): Error {
  const errorMap: Record<number, string> = {
    401: 'AI 服务认证失败，请检查 API Key 配置',
    403: 'AI 服务权限不足',
    404: 'AI 模型不存在',
    429: 'AI 服务繁忙，请稍后重试',
    500: 'AI 服务暂时不可用',
    502: 'AI 服务网关错误',
    503: 'AI 服务维护中',
    504: 'AI 服务响应超时',
  };

  const userMessage = errorMap[status] || `AI 服务错误: ${message}`;
  return new Error(userMessage);
}

/**
 * 非流式调用
 */
export async function invoke(
  messages: LLMMessage[],
  options: LLMOptions = {}
): Promise<LLMResponse> {
  const config = getConfig();
  const model = options.model || config.model;

  const startTime = Date.now();
  console.log(`[LLM] invoke start | model=${model} | messages=${messages.length}`);

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[LLM] invoke error | status=${response.status} | body=${errorText}`);
      throw handleError(response.status, errorText);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    console.log(`[LLM] invoke done | model=${model} | latency=${Date.now() - startTime}ms | tokens=${data.usage?.total_tokens}`);

    return { content };
  } catch (error) {
    console.error(`[LLM] invoke failed | model=${model} | error=`, error);
    throw error;
  }
}

/**
 * 流式调用（返回 ReadableStream）
 */
export function stream(
  messages: LLMMessage[],
  options: LLMOptions = {}
): ReadableStream<string> {
  const config = getConfig();
  const model = options.model || config.model;

  console.log(`[LLM] stream start | model=${model} | messages=${messages.length}`);

  return new ReadableStream<string>({
    async start(controller) {
      const startTime = Date.now();
      let totalContent = '';

      try {
        const response = await fetch(`${config.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens,
            stream: true,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[LLM] stream error | status=${response.status} | body=${errorText}`);
          throw handleError(response.status, errorText);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Response body is null');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data:')) continue;

            const data = trimmed.slice(5).trim();
            if (data === '[DONE]') {
              console.log(`[LLM] stream done | model=${model} | latency=${Date.now() - startTime}ms`);
              controller.close();
              return;
            }

            try {
              const json = JSON.parse(data);
              const content = json.choices?.[0]?.delta?.content || '';
              if (content) {
                totalContent += content;
                controller.enqueue(content);
              }
            } catch {
              // 忽略解析错误
            }
          }
        }

        controller.close();
      } catch (error) {
        console.error(`[LLM] stream failed | model=${model} | error=`, error);
        controller.error(error);
      }
    },
  });
}

/**
 * 流式调用（异步迭代器版本）
 */
export async function* streamIterator(
  messages: LLMMessage[],
  options: LLMOptions = {}
): AsyncGenerator<string> {
  const config = getConfig();
  const model = options.model || config.model;

  console.log(`[LLM] streamIterator start | model=${model} | messages=${messages.length}`);

  const startTime = Date.now();

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[LLM] streamIterator error | status=${response.status} | body=${errorText}`);
    throw handleError(response.status, errorText);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is null');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;

        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') {
          console.log(`[LLM] streamIterator done | model=${model} | latency=${Date.now() - startTime}ms`);
          return;
        }

        try {
          const json = JSON.parse(data);
          const content = json.choices?.[0]?.delta?.content || '';
          if (content) {
            yield content;
          }
        } catch {
          // 忽略解析错误
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}