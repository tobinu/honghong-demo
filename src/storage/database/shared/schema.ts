import { pgTable, serial, varchar, text, timestamp, integer, boolean, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"


// ========== 健康检查 ==========

export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// ========== 用户表 ==========

export const users = pgTable(
	"users",
	{
		id: serial("id").primaryKey(),
		username: varchar("username", { length: 50 }).notNull().unique(),
		password: text("password").notNull(),
		avatarUrl: varchar("avatar_url", { length: 500 }),
		nickname: varchar("nickname", { length: 50 }),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		uniqueIndex("users_username_idx").on(table.username),
	]
);

// ========== 角色表 ==========

export const characters = pgTable(
	"characters",
	{
		id: varchar("id", { length: 20 }).primaryKey(),
		name: varchar("name", { length: 50 }).notNull(),
		title: varchar("title", { length: 50 }).notNull(),
		description: varchar("description", { length: 200 }).notNull(),
		personalityPrompt: text("personality_prompt").notNull(),
		tags: jsonb("tags").notNull().$type<string[]>(),
		isActive: boolean("is_active").default(true).notNull(),
		sortOrder: integer("sort_order").default(0).notNull(),
	},
	(table) => [
		index("characters_is_active_sort_idx").on(table.isActive, table.sortOrder),
	]
);

// ========== 角色立绘表 ==========

export const characterPortraits = pgTable(
	"character_portraits",
	{
		id: serial("id").primaryKey(),
		characterId: varchar("character_id", { length: 20 }).notNull(),
		portraitState: varchar("portrait_state", { length: 20 }).notNull(),
		imageUrl: text("image_url").notNull(),
	},
	(table) => [
		uniqueIndex("character_portraits_unique_idx").on(table.characterId, table.portraitState),
		index("character_portraits_character_id_idx").on(table.characterId),
	]
);

// ========== 场景表 ==========

export const scenarios = pgTable(
	"scenarios",
	{
		id: varchar("id", { length: 50 }).primaryKey(),
		characterId: varchar("character_id", { length: 20 }),
		title: varchar("title", { length: 50 }).notNull(),
		description: varchar("description", { length: 300 }).notNull(),
		initialForgiveness: integer("initial_forgiveness").default(20).notNull(),
		difficulty: varchar("difficulty", { length: 20 }),
		isActive: boolean("is_active").default(true).notNull(),
	},
	(table) => [
		index("scenarios_character_id_idx").on(table.characterId),
		index("scenarios_is_active_idx").on(table.isActive),
	]
);

// ========== 游戏记录表 ==========

export const gameRecords = pgTable(
	"game_records",
	{
		id: serial("id").primaryKey(),
		userId: integer("user_id").notNull(),
		characterId: varchar("character_id", { length: 20 }).notNull(),
		scenarioId: varchar("scenario_id", { length: 50 }).notNull(),
		roundsPlayed: integer("rounds_played").notNull(),
		finalScore: integer("final_score").notNull(),
		result: varchar("result", { length: 20 }).notNull(),
		playedAt: timestamp("played_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("game_records_user_id_idx").on(table.userId),
		index("game_records_character_score_idx").on(table.characterId, table.finalScore),
		index("game_records_leaderboard_idx").on(table.result, table.finalScore),
		index("game_records_played_at_idx").on(table.playedAt),
	]
);

// ========== 对话消息表 ==========

export const conversationMessages = pgTable(
	"conversation_messages",
	{
		id: serial("id").primaryKey(),
		gameRecordId: integer("game_record_id").notNull(),
		roundNumber: integer("round_number").notNull(),
		role: varchar("role", { length: 10 }).notNull(),
		content: text("content").notNull(),
		emotion: varchar("emotion", { length: 20 }),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("conversation_messages_game_record_id_idx").on(table.gameRecordId),
	]
);

// ========== 博客文章表 ==========

export const blogPosts = pgTable(
	"blog_posts",
	{
		id: serial("id").primaryKey(),
		title: varchar("title", { length: 200 }).notNull(),
		slug: varchar("slug", { length: 100 }).notNull().unique(),
		summary: varchar("summary", { length: 500 }).notNull(),
		content: text("content").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		uniqueIndex("blog_posts_slug_idx").on(table.slug),
		index("blog_posts_created_at_idx").on(table.createdAt),
	]
);
