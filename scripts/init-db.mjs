import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
import { Pool } from 'pg';

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const hasSsl = rawUrl.includes('sslmode=');
const cleanUrl = rawUrl
  .replace(/[?&]sslmode=[^&]*/, '')
  .replace(/[?&]channel_binding=[^&]*/, '')
  .replace(/&$/, '')
  .replace(/\?$/, '');

const pool = new Pool({
  connectionString: cleanUrl,
  ssl: hasSsl ? { rejectUnauthorized: false } : undefined,
});

const createTablesSQL = `
-- ========== 健康检查 ==========

CREATE TABLE IF NOT EXISTS health_check (
  id SERIAL NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== 用户表 ==========

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password TEXT NOT NULL,
  avatar_url VARCHAR(500),
  nickname VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS users_username_idx ON users(username);

-- ========== 角色表 ==========

CREATE TABLE IF NOT EXISTS characters (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  title VARCHAR(50) NOT NULL,
  description VARCHAR(200) NOT NULL,
  personality_prompt TEXT NOT NULL,
  tags JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  sort_order INTEGER DEFAULT 0 NOT NULL
);

CREATE INDEX IF NOT EXISTS characters_is_active_sort_idx ON characters(is_active, sort_order);

-- ========== 角色立绘表 ==========

CREATE TABLE IF NOT EXISTS character_portraits (
  id SERIAL PRIMARY KEY,
  character_id VARCHAR(20) NOT NULL,
  portrait_state VARCHAR(20) NOT NULL,
  image_url TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS character_portraits_unique_idx ON character_portraits(character_id, portrait_state);
CREATE INDEX IF NOT EXISTS character_portraits_character_id_idx ON character_portraits(character_id);

-- ========== 场景表 ==========

CREATE TABLE IF NOT EXISTS scenarios (
  id VARCHAR(50) PRIMARY KEY,
  character_id VARCHAR(20),
  title VARCHAR(50) NOT NULL,
  description VARCHAR(300) NOT NULL,
  initial_forgiveness INTEGER DEFAULT 20 NOT NULL,
  difficulty VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE NOT NULL
);

CREATE INDEX IF NOT EXISTS scenarios_character_id_idx ON scenarios(character_id);
CREATE INDEX IF NOT EXISTS scenarios_is_active_idx ON scenarios(is_active);

-- ========== 游戏记录表 ==========

-- 先处理旧表结构（如果存在旧结构则迁移）
DO $$
BEGIN
  -- 检查 game_records 是否缺少新列
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'game_records') THEN
    -- 添加新列（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'game_records' AND column_name = 'character_id') THEN
      ALTER TABLE game_records ADD COLUMN character_id VARCHAR(20) NOT NULL DEFAULT 'tsundere';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'game_records' AND column_name = 'scenario_id') THEN
      ALTER TABLE game_records ADD COLUMN scenario_id VARCHAR(50) NOT NULL DEFAULT 'late-reply';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'game_records' AND column_name = 'rounds_played') THEN
      ALTER TABLE game_records ADD COLUMN rounds_played INTEGER NOT NULL DEFAULT 10;
    END IF;

    -- 如果旧的 scenario 列存在（旧结构），迁移数据后删除
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'game_records' AND column_name = 'scenario' AND column_name != 'scenario_id') THEN
      -- 旧 scenario 列内容迁移到 scenario_id
      UPDATE game_records SET scenario_id = scenario WHERE scenario_id = 'late-reply' AND scenario IS NOT NULL;
      ALTER TABLE game_records DROP COLUMN scenario;
    END IF;

    -- 添加 users 表新列
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatar_url') THEN
      ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'nickname') THEN
      ALTER TABLE users ADD COLUMN nickname VARCHAR(50);
    END IF;

    -- 修改 users.password 从 varchar(200) 到 text
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password' AND data_type = 'character varying') THEN
      ALTER TABLE users ALTER COLUMN password TYPE TEXT;
    END IF;
  END IF;
END $$;

-- 创建新表（如果不存在）
CREATE TABLE IF NOT EXISTS game_records (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  character_id VARCHAR(20) NOT NULL,
  scenario_id VARCHAR(50) NOT NULL,
  rounds_played INTEGER NOT NULL,
  final_score INTEGER NOT NULL,
  result VARCHAR(20) NOT NULL,
  played_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS game_records_user_id_idx ON game_records(user_id);
CREATE INDEX IF NOT EXISTS game_records_character_score_idx ON game_records(character_id, final_score);
CREATE INDEX IF NOT EXISTS game_records_leaderboard_idx ON game_records(result, final_score);
CREATE INDEX IF NOT EXISTS game_records_played_at_idx ON game_records(played_at);

-- ========== 对话消息表 ==========

CREATE TABLE IF NOT EXISTS conversation_messages (
  id SERIAL PRIMARY KEY,
  game_record_id INTEGER NOT NULL,
  round_number INTEGER NOT NULL,
  role VARCHAR(10) NOT NULL,
  content TEXT NOT NULL,
  emotion VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS conversation_messages_game_record_id_idx ON conversation_messages(game_record_id);

-- ========== 博客文章表 ==========

CREATE TABLE IF NOT EXISTS blog_posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  summary VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS blog_posts_slug_idx ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS blog_posts_created_at_idx ON blog_posts(created_at);
`;

async function main() {
  try {
    console.log('Creating/migrating tables...');
    await pool.query(createTablesSQL);
    console.log('✓ All tables created/migrated successfully');

    console.log('\nChecking tables...');
    const tablesResult = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    console.log('✓ Tables:', tablesResult.rows.map(r => r.table_name).join(', '));

    console.log('\nChecking blog posts count...');
    const blogResult = await pool.query('SELECT COUNT(*) as count FROM blog_posts');
    console.log(`✓ blog_posts count: ${blogResult.rows[0].count}`);

    await pool.end();
    console.log('\nDatabase initialization complete!');
  } catch (err) {
    console.error('Database initialization failed:', err.message);
    process.exit(1);
  }
}

main();
