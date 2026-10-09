CREATE TYPE "public"."issue_category" AS ENUM('bug', 'balance', 'skill_issue');--> statement-breakpoint
CREATE TYPE "public"."issue_status" AS ENUM('reported', 'dismissed', 'watch');--> statement-breakpoint
CREATE TYPE "public"."run_status" AS ENUM('running', 'done', 'failed');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('blocker', 'major', 'minor', 'cosmetic');--> statement-breakpoint
CREATE TYPE "public"."task_state" AS ENUM('todo', 'in_progress', 'done', 'wont_fix');--> statement-breakpoint
CREATE TABLE "issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"priority" integer,
	"title" text NOT NULL,
	"status" "issue_status" NOT NULL,
	"category" "issue_category" NOT NULL,
	"severity" "severity",
	"level" integer,
	"level_name" text,
	"mechanic" text NOT NULL,
	"players_lost" integer DEFAULT 0 NOT NULL,
	"reports" integer NOT NULL,
	"distinct_players" integer NOT NULL,
	"telemetry_evidence" text NOT NULL,
	"detail" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"scenario" text NOT NULL,
	"game" text NOT NULL,
	"model" text NOT NULL,
	"prompt_version" text NOT NULL,
	"telemetry" integer NOT NULL,
	"status" "run_status" DEFAULT 'running' NOT NULL,
	"error" text,
	"messages_processed" integer DEFAULT 0 NOT NULL,
	"tokens_in" integer DEFAULT 0 NOT NULL,
	"tokens_out" integer DEFAULT 0 NOT NULL,
	"cost_usd" real DEFAULT 0 NOT NULL,
	"seconds" real DEFAULT 0 NOT NULL,
	"result" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"issue_id" uuid NOT NULL,
	"state" "task_state" DEFAULT 'todo' NOT NULL,
	"assignee" text,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_issue_id_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "issues_run_idx" ON "issues" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "tasks_issue_idx" ON "tasks" USING btree ("issue_id");