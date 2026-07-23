import { NextRequest, NextResponse } from 'next/server';

/**
 * 图片下载代理 API
 * 
 * 用于下载跨域图片，设置正确的 Content-Disposition 头触发浏览器下载
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    const filename = searchParams.get('filename') || `try-on-${Date.now()}.png`;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    console.log(`[DOWNLOAD] Fetching image: ${imageUrl.substring(0, 100)}...`);

    // 从远程服务器获取图片
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.error(`[DOWNLOAD] Failed to fetch image: ${response.status}`);
      return NextResponse.json(
        { error: 'Failed to fetch image' },
        { status: response.status }
      );
    }

    // 获取图片数据
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';

    console.log(`[DOWNLOAD] Image fetched successfully, size: ${imageBuffer.byteLength} bytes`);

    // 返回图片，设置下载头
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': imageBuffer.byteLength.toString(),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('[DOWNLOAD] Error:', error);
    return NextResponse.json(
      { error: 'Failed to download image' },
      { status: 500 }
    );
  }
}