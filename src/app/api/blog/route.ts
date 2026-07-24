import { NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const posts = await db
      .select({
        id: schema.blogPosts.id,
        title: schema.blogPosts.title,
        slug: schema.blogPosts.slug,
        summary: schema.blogPosts.summary,
        createdAt: schema.blogPosts.createdAt,
      })
      .from(schema.blogPosts)
      .orderBy(desc(schema.blogPosts.createdAt));

    return NextResponse.json({ posts });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取博客列表失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
