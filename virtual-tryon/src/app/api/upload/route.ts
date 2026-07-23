import { NextRequest, NextResponse } from 'next/server';

/**
 * 图片上传 API
 * 将图片转换为 base64 data URL，供试衣 API 使用
 */

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File | null;

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!image.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (image.size > maxSize) {
      return NextResponse.json(
        { error: 'Image size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Convert to base64 data URL
    const buffer = await image.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUrl = `data:${image.type};base64,${base64}`;

    console.log(`[UPLOAD] success | type=${image.type} | size=${image.size}`);

    return NextResponse.json({
      url: dataUrl,
      type: image.type,
      size: image.size,
    });
  } catch (error) {
    console.error('[UPLOAD] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload image' },
      { status: 500 }
    );
  }
}