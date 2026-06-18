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
CREATE TABLE IF NOT EXISTS health_check (
  id SERIAL NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  summary VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS blog_posts_slug_idx ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS blog_posts_created_at_idx ON blog_posts(created_at);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS users_username_idx ON users(username);

CREATE TABLE IF NOT EXISTS game_records (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  scenario VARCHAR(200) NOT NULL,
  final_score INTEGER NOT NULL,
  result VARCHAR(20) NOT NULL,
  played_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS game_records_user_id_idx ON game_records(user_id);
`;

async function main() {
  try {
    console.log('Creating tables...');
    await pool.query(createTablesSQL);
    console.log('✓ All tables created successfully');

    console.log('\nChecking existing blog posts...');
    const result = await pool.query('SELECT COUNT(*) as count FROM blog_posts');
    console.log(`✓ Current blog_posts count: ${result.rows[0].count}`);

    await pool.end();
    console.log('\nDatabase initialization complete!');
  } catch (err) {
    console.error('Database initialization failed:', err.message);
    process.exit(1);
  }
}

main();
