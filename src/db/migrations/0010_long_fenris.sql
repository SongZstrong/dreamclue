CREATE TABLE "knowledge_files" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"file_path" text NOT NULL,
	"title" text,
	"author" text,
	"description" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"chunk_count" integer,
	"error_message" text,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "knowledge_files" ADD CONSTRAINT "knowledge_files_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "knowledge_files_user_id_idx" ON "knowledge_files" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "knowledge_files_status_idx" ON "knowledge_files" USING btree ("status");