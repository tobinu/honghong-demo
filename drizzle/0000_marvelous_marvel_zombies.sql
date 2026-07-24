CREATE TABLE "blog_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"summary" varchar(500) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "character_portraits" (
	"id" serial PRIMARY KEY NOT NULL,
	"character_id" varchar(20) NOT NULL,
	"portrait_state" varchar(20) NOT NULL,
	"image_url" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "characters" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"title" varchar(50) NOT NULL,
	"description" varchar(200) NOT NULL,
	"personality_prompt" text NOT NULL,
	"tags" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_record_id" integer NOT NULL,
	"round_number" integer NOT NULL,
	"role" varchar(10) NOT NULL,
	"content" text NOT NULL,
	"emotion" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"character_id" varchar(20) NOT NULL,
	"scenario_id" varchar(50) NOT NULL,
	"rounds_played" integer NOT NULL,
	"final_score" integer NOT NULL,
	"result" varchar(20) NOT NULL,
	"played_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_check" (
	"id" serial NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "scenarios" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"character_id" varchar(20),
	"title" varchar(50) NOT NULL,
	"description" varchar(300) NOT NULL,
	"initial_forgiveness" integer DEFAULT 20 NOT NULL,
	"difficulty" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"password" text NOT NULL,
	"avatar_url" varchar(500),
	"nickname" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "blog_posts_slug_idx" ON "blog_posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "blog_posts_created_at_idx" ON "blog_posts" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "character_portraits_unique_idx" ON "character_portraits" USING btree ("character_id","portrait_state");--> statement-breakpoint
CREATE INDEX "character_portraits_character_id_idx" ON "character_portraits" USING btree ("character_id");--> statement-breakpoint
CREATE INDEX "characters_is_active_sort_idx" ON "characters" USING btree ("is_active","sort_order");--> statement-breakpoint
CREATE INDEX "conversation_messages_game_record_id_idx" ON "conversation_messages" USING btree ("game_record_id");--> statement-breakpoint
CREATE INDEX "game_records_user_id_idx" ON "game_records" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "game_records_character_score_idx" ON "game_records" USING btree ("character_id","final_score");--> statement-breakpoint
CREATE INDEX "game_records_leaderboard_idx" ON "game_records" USING btree ("result","final_score");--> statement-breakpoint
CREATE INDEX "game_records_played_at_idx" ON "game_records" USING btree ("played_at");--> statement-breakpoint
CREATE INDEX "scenarios_character_id_idx" ON "scenarios" USING btree ("character_id");--> statement-breakpoint
CREATE INDEX "scenarios_is_active_idx" ON "scenarios" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_idx" ON "users" USING btree ("username");