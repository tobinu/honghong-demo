import Link from "next/link";
import { desc } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "恋爱攻略 - 哄哄模拟器",
  description: "提升你的恋爱沟通技能",
};

interface BlogPostRow {
  id: number;
  title: string;
  slug: string;
  summary: string;
  createdAt: string;
}

function getEmoji(title: string): string {
  if (title.includes("30") || title.includes("分钟") || title.includes("时间")) return "⏰";
  if (title.includes("说得对") || title.includes("敷衍") || title.includes("烂")) return "😤";
  if (title.includes("道歉") || title.includes("对不起")) return "💝";
  if (title.includes("异地")) return "🌉";
  if (title.includes("冷战") || title.includes("沉默")) return "🧊";
  if (title.includes("安全感") || title.includes("信任")) return "🛡️";
  if (title.includes("边界") || title.includes("底线")) return "⚖️";
  if (title.includes("幽默") || title.includes("搞笑")) return "😄";
  if (title.includes("倾听") || title.includes("听")) return "👂";
  if (title.includes("仪式") || title.includes("浪漫")) return "🎀";
  if (title.includes("关心") || title.includes("控制")) return "💡";
  if (title.includes("前任")) return "🔒";
  if (title.includes("撒娇")) return "🥺";
  if (title.includes("自我") || title.includes("独立")) return "🌟";
  if (title.includes("热水") || title.includes("废话")) return "☕";
  return "💕";
}

export default async function BlogPage() {
  let posts: BlogPostRow[] = [];

  try {
    const db = getDb();
    const rows = await db
      .select({
        id: schema.blogPosts.id,
        title: schema.blogPosts.title,
        slug: schema.blogPosts.slug,
        summary: schema.blogPosts.summary,
        createdAt: schema.blogPosts.createdAt,
      })
      .from(schema.blogPosts)
      .orderBy(desc(schema.blogPosts.createdAt));

    posts = rows.map((r) => ({
      ...r,
      createdAt: r.createdAt as unknown as string,
    }));
  } catch (err) {
    console.error("Failed to fetch blog posts:", err);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-pink-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-pink-50 text-pink-500 hover:bg-pink-100 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-gray-800">恋爱攻略</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <p className="text-sm text-gray-500 mb-6">
          吵架不可怕，不会哄才可怕。读完这些，你也能成为哄人高手 ✨
        </p>

        {posts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>暂无文章，敬请期待...</p>
          </div>
        ) : (
          posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`}>
              <article className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50 hover:shadow-md hover:border-pink-200 transition-all duration-200 group cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="text-3xl flex-shrink-0 mt-1">{getEmoji(post.title)}</div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-bold text-gray-800 group-hover:text-pink-500 transition-colors mb-2 line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                      {post.summary}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        3 分钟
                      </span>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-300 group-hover:text-pink-400 transition-colors flex-shrink-0 mt-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </article>
            </Link>
          ))
        )}
      </main>
    </div>
  );
}
