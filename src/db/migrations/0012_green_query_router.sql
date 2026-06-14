CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TABLE "knowledge_chunks" (
	"id" text PRIMARY KEY NOT NULL,
	"file_id" text NOT NULL,
	"file_name" text NOT NULL,
	"title" text NOT NULL,
	"text" text NOT NULL,
	"search_tokens" text NOT NULL,
	"chunk_id" integer NOT NULL,
	"start" integer NOT NULL,
	"end" integer NOT NULL,
	"embedding" vector(4096) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"search_vector" tsvector GENERATED ALWAYS AS (
		to_tsvector('simple', "search_tokens")
	) STORED
);
--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_file_id_knowledge_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."knowledge_files"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "knowledge_chunks_file_id_idx" ON "knowledge_chunks" USING btree ("file_id");
--> statement-breakpoint
CREATE INDEX "knowledge_chunks_created_at_idx" ON "knowledge_chunks" USING btree ("created_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_chunks_file_chunk_idx" ON "knowledge_chunks" USING btree ("file_id", "chunk_id");
--> statement-breakpoint
CREATE INDEX "knowledge_chunks_search_vector_idx" ON "knowledge_chunks" USING gin ("search_vector");
