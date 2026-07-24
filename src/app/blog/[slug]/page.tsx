import Link from "next/link";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

interface BlogPostRow {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
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

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const db = getDb();
    const rows = await db
      .select({ title: schema.blogPosts.title, summary: schema.blogPosts.summary })
      .from(schema.blogPosts)
      .where(eq(schema.blogPosts.slug, slug))
      .limit(1);

    if (rows.length === 0) return { title: "文章未找到" };
    return {
      title: `${rows[0].title} - 恋爱攻略`,
      description: rows[0].summary,
    };
  } catch {
    return { title: "恋爱攻略" };
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;

  let post: BlogPostRow | null = null;

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.blogPosts)
      .where(eq(schema.blogPosts.slug, slug))
      .limit(1);

    if (rows.length > 0) {
      post = {
        id: rows[0].id,
        title: rows[0].title,
        slug: rows[0].slug,
        summary: rows[0].summary,
        content: rows[0].content,
        createdAt: rows[0].createdAt as unknown as string,
      };
    }
  } catch (err) {
    console.error("Failed to fetch blog post:", err);
  }

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-pink-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/blog"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-pink-50 text-pink-500 hover:bg-pink-100 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-gray-800">恋爱攻略</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <article>
          <div className="mb-8">
            <div className="text-4xl mb-4">{getEmoji(post.title)}</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3 leading-tight">
              {post.title}
            </h1>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                3 分钟
              </span>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-pink-200 to-transparent mb-8" />

          <div className="prose prose-pink prose-sm max-w-none">
            {post.content.split("\n\n").map((paragraph, index) => (
              <p
                key={index}
                className="text-gray-700 leading-relaxed mb-4 text-[15px]"
              >
                {paragraph}
              </p>
            ))}
          </div>

          <div className="mt-10 p-5 bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl border border-pink-100">
            <p className="text-sm text-gray-600 mb-3">
              学会了？来实战练练手吧 💪
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-pink-500 text-white text-sm font-medium rounded-full hover:bg-pink-600 transition-colors"
            >
              开始哄人
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
