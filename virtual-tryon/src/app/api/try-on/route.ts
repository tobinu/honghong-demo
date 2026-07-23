import { NextRequest, NextResponse } from 'next/server';
import { virtualTryOn, detectClothingCategory } from '@/lib/tryon';

/**
 * Virtual Try-On API
 * 
 * 接收两张图片 URL，调用火山引擎图生图 API 生成试衣结果
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { personImageUrl, garmentImageUrl, prompt } = body;

    if (!personImageUrl || !garmentImageUrl) {
      return NextResponse.json(
        { error: 'Both person and garment image URLs are required' },
        { status: 400 }
      );
    }

    console.log(`[TRYON API] request | person=${personImageUrl.substring(0, 50)}... | garment=${garmentImageUrl.substring(0, 50)}...`);

    // 调用 Service 层
    const result = await virtualTryOn({
      personImageUrl,
      garmentImageUrl,
      prompt,
    });

    // 检测服装类别
    const category = detectClothingCategory(prompt || '');

    return NextResponse.json({
      id: `tryon-${Date.now()}`,
      personImageUrl,
      garmentImageUrl,
      resultImageUrl: result.resultImageUrl,
      size: result.size,
      category,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[TRYON API] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process try-on' },
      { status: 500 }
    );
  }
}