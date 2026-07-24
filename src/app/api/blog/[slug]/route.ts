import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const db = getDb();

    const posts = await db
      .select()
      .from(schema.blogPosts)
      .where(eq(schema.blogPosts.slug, slug))
      .limit(1);

    if (posts.length === 0) {
      return NextResponse.json({ error: '文章未找到' }, { status: 404 });
    }

    const post = {
      id: posts[0].id,
      title: posts[0].title,
      slug: posts[0].slug,
      summary: posts[0].summary,
      content: posts[0].content,
      createdAt: posts[0].createdAt,
    };

    return NextResponse.json({ post });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取博客详情失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
