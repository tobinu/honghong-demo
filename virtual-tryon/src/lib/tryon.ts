/**
 * Virtual Try-On Service Layer
 * 封装火山引擎图生图 API
 */

export interface TryOnOptions {
  personImageUrl: string;
  garmentImageUrl: string;
  prompt?: string;
}

export interface TryOnResult {
  resultImageUrl: string;
  size: string;
  created: number;
}

/** 获取配置 */
function getConfig() {
  const apiKey = process.env.TRYON_API_KEY;
  const baseUrl = process.env.TRYON_API_URL || 'https://ark.cn-beijing.volces.com/api/v3';
  const model = process.env.TRYON_MODEL || 'doubao-seedream-5-0-260128';

  if (!apiKey) {
    throw new Error('TRYON_API_KEY is not set in environment variables');
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
 * 调用虚拟试衣 API
 * @param options 试衣参数
 * @returns 试衣结果
 */
export async function virtualTryOn(options: TryOnOptions): Promise<TryOnResult> {
  const config = getConfig();
  const { personImageUrl, garmentImageUrl, prompt } = options;

  const startTime = Date.now();
  console.log(`[TRYON] start | person=${personImageUrl} | garment=${garmentImageUrl}`);

  // 默认 prompt
  const defaultPrompt = '让图片1里的人，穿上图片2的衣服，保持人物姿势和背景不变，服装要自然贴合身体';
  const finalPrompt = prompt || defaultPrompt;

  try {
    const response = await fetch(`${config.baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        prompt: finalPrompt,
        image: [personImageUrl, garmentImageUrl],
        sequential_image_generation: 'auto',
        sequential_image_generation_options: {
          max_images: 1,
        },
        response_format: 'url',
        size: '2K',
        stream: false,
        watermark: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[TRYON] error | status=${response.status} | body=${errorText}`);
      throw handleError(response.status, errorText);
    }

    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      throw new Error('AI 服务返回结果为空');
    }

    const result: TryOnResult = {
      resultImageUrl: data.data[0].url,
      size: data.data[0].size,
      created: data.created,
    };

    console.log(`[TRYON] done | latency=${Date.now() - startTime}ms | result=${result.resultImageUrl}`);

    return result;
  } catch (error) {
    console.error(`[TRYON] failed | latency=${Date.now() - startTime}ms | error=`, error);
    throw error;
  }
}

/**
 * 检测服装类别（基于 prompt）
 * 简单实现：通过关键词判断
 */
export function detectClothingCategory(prompt: string): 'top' | 'bottom' | 'dress' | 'unknown' {
  const topKeywords = ['上衣', '衬衫', 'T恤', '外套', '夹克', '毛衣', '卫衣', 'top', 'shirt', 'jacket'];
  const bottomKeywords = ['裤子', '裙', '短裤', '牛仔裤', '长裤', 'bottom', 'pants', 'skirt'];
  const dressKeywords = ['连衣裙', '裙子', '长裙', '短裙', 'dress', 'gown'];

  const lowerPrompt = prompt.toLowerCase();

  for (const keyword of topKeywords) {
    if (lowerPrompt.includes(keyword)) return 'top';
  }

  for (const keyword of bottomKeywords) {
    if (lowerPrompt.includes(keyword)) return 'bottom';
  }

  for (const keyword of dressKeywords) {
    if (lowerPrompt.includes(keyword)) return 'dress';
  }

  return 'unknown';
}