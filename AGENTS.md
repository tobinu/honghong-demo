# 哄哄模拟器（代入感增强版）- 项目上下文

## 项目概览

日系视觉小说风格的哄人模拟器网页应用。通过 2D 立绘表情切换 + 背景氛围联动 + TTS 语音情绪调节，让玩家"看见"也"听见"角色情绪流转。

核心流程：首页（选角色）→ 对话页（10 轮对话，LLM 流式驱动）→ 结算页（结局立绘+结语）

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4
- **AI**: coze-coding-dev-sdk (LLM + TTS)
- **Database**: Supabase (drizzle-orm schema, service_role_key)

## 目录结构

```
├── public/                 # 静态资源
├── scripts/                # 构建与启动脚本
├── src/
│   ├── app/
│   │   ├── page.tsx        # 主页面（首页/对话/结算三屏切换）
│   │   ├── layout.tsx      # 全局布局
│   │   ├── globals.css     # 全局样式 + 自定义动画
│   │   ├── blog/
│   │   │   ├── page.tsx            # 博客列表页（从 Supabase 读取）
│   │   │   └── [slug]/page.tsx     # 博客详情页（从 Supabase 读取）
│   │   ├── leaderboard/page.tsx   # 排行榜页面（公开，前20名）
│   │   ├── profile/page.tsx       # 个人页面（游戏记录历史）
│   │   └── api/
│   │       ├── chat/route.ts           # LLM 对话 API（SSE 流式）
│   │       ├── tts/route.ts            # TTS 语音合成 API
│   │       ├── opening-line/route.ts   # 角色开场白 API
│   │       ├── suggestions/route.ts    # 建议话术 API
│   │       ├── review/route.ts         # 对话复盘评价 API
│   │       ├── auth/
│   │       │   ├── register/route.ts   # 用户注册 API（POST）
│   │       │   ├── login/route.ts      # 用户登录 API（POST）
│   │       │   ├── logout/route.ts     # 退出登录 API（POST）
│   │       │   └── me/route.ts         # 获取当前用户 API（GET）
│   │       ├── game-records/route.ts   # 游戏记录 API（POST 保存 / GET 查询）
│   │       ├── leaderboard/route.ts   # 排行榜 API（GET 公开，前20名最高分）
│   │       └── blog/
│   │           ├── route.ts            # 博客列表 API（GET）
│   │           ├── migrate/route.ts    # 博客数据迁移 API（POST）
│   │           ├── generate/route.ts   # LLM 自动生成文章 API（POST）
│   │           └── [slug]/route.ts     # 博客详情 API（GET）
│   ├── components/ui/      # Shadcn UI 组件库
│   ├── hooks/              # 自定义 Hooks
│   └── lib/
│       ├── utils.ts            # 通用工具函数 (cn)
│       ├── types.ts            # 类型定义（Character, Scenario, GameState 等）
│       ├── game-data.ts        # 游戏数据（角色、场景、情绪映射、立绘配置）
│       ├── storage.ts          # localStorage 游戏记录管理
│       ├── blog-data.ts        # [已废弃] 旧静态博客数据，已被 Supabase 替代
│       ├── supabase-client.ts  # Supabase 客户端（service_role_key）
│       └── auth.ts             # 认证工具（JWT、bcrypt、Cookie 管理）
├── src/storage/database/
│   └── shared/schema.ts   # Drizzle ORM schema（含 blog_posts, users, game_records 表）
├── DESIGN.md               # 设计规范
├── next.config.ts          # Next.js 配置
├── package.json            # 项目依赖
└── tsconfig.json           # TypeScript 配置
```

## 核心数据模型

- **3 角色**：小雪（傲娇型）、小雨（温柔型）、小霜（冷艳型）
- **6-8 场景**：随机抽取"生气原因"
- **4 情绪态**：angry → wronged → hesitant → happy（映射立绘表情）
- **3 氛围背景**：dark（暗红）→ neutral（灰紫）→ bright（暖金）
- **原谅值**：0-100，初始 20，LLM 输出情绪标签 → 前端映射分数变化

## API 接口

| 路径 | 方法 | 说明 |
|------|------|------|
| /api/chat | POST | SSE 流式对话，返回 text + [EMOTION:xxx] 标签 |
| /api/tts | POST | TTS 语音合成，返回 base64 音频数据 |
| /api/opening-line | POST | 生成角色开场白 |
| /api/suggestions | POST | 生成建议话术（1 雷区 + 3 策略） |
| /api/review | POST | 对话复盘评价 |
| /api/blog | GET | 获取博客列表 |
| /api/blog/[slug] | GET | 获取博客详情 |
| /api/blog/migrate | POST | 迁移静态博客数据到数据库 |
| /api/blog/generate | POST | LLM 自动生成新文章并保存到数据库 |
| /api/auth/register | POST | 用户注册，自动登录 |
| /api/auth/login | POST | 用户登录 |
| /api/auth/logout | POST | 退出登录 |
| /api/auth/me | GET | 获取当前登录用户信息 |
| /api/game-records | POST | 保存游戏记录（需登录） |
| /api/game-records | GET | 查询当前用户游戏记录（需登录） |
| /api/leaderboard | GET | 排行榜（公开，前20名最高好感度） |

## 数据库表结构

### blog_posts 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | serial | 自增主键 |
| title | varchar(200) | 文章标题 |
| slug | varchar(100) | URL 友好标识（唯一） |
| summary | varchar(500) | 文章摘要 |
| content | text | 文章正文 |
| created_at | timestamptz | 创建时间 |

RLS 策略：场景 A（公开读写），service_role_key 绕过 RLS，无需创建 policy。

### users 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | serial | 自增主键 |
| username | varchar(50) | 用户名（唯一） |
| password | text | bcrypt 哈希加密的密码 |
| created_at | timestamptz | 注册时间 |

### game_records 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | serial | 自增主键 |
| user_id | integer | 关联 users.id |
| scenario | varchar(200) | 场景名称 |
| final_score | integer | 最终好感度分数 |
| result | varchar(20) | 通关/失败（success/failure） |
| played_at | timestamptz | 游戏时间 |

RLS 策略：场景 A，service_role_key 绕过 RLS，无需创建 policy。

## 包管理规范

**仅允许使用 pnpm** 作为包管理器，**严禁使用 npm 或 yarn**。

## 开发规范

### 编码规范

- 默认按 TypeScript `strict` 心智写代码；优先复用当前作用域已声明的变量、函数、类型和导入
- 禁止隐式 `any` 和 `as any`；函数参数、返回值需明确类型
- 严禁在 JSX 渲染逻辑中直接使用 Math.random()，使用 useMemo 预计算确定性值

### Hydration 问题防范

1. 严禁在 JSX 渲染逻辑中直接使用 typeof window、Date.now()、Math.random() 等动态数据
2. 必须使用 'use client' + useEffect + useState 确保动态内容仅在客户端挂载后渲染
3. 禁止使用 head 标签，优先使用 metadata

### 流式输出规范

- Chat API 使用 SSE 格式，先输出文本内容，末尾附带 `[EMOTION:xxx]` 标签
- 前端用 fetch + ReadableStream 逐块读取，打字机效果渲染文本
- 情绪标签在文本完成后解析，驱动立绘/背景切换

### TTS 预加载规范

- 每轮 AI 回复完成后，后台自动调 TTS 生成语音缓存
- 点击播放按钮时从缓存读取，秒出
- 语速/音调随原谅值动态调节（低原谅值 → 语速快/音调高）

### 数据库操作规范

- 使用 `getSupabaseClient()` 获取客户端（后端默认使用 service_role_key）
- 所有操作必须检查 error 并 throw，禁止 console.error 后继续
- 默认使用 `.maybeSingle()` 查询单条记录
- 禁止 `createClient<Database>` 泛型（database.types.ts 不存在）

## UI 设计规范

- 日系视觉小说风格：粉彩色调、圆体字、半透明对话框、樱花装饰
- 移动端优先，竖屏设计
- 使用 shadcn/ui 组件和规范
