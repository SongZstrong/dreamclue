ALTER TABLE "knowledge_files" ADD COLUMN IF NOT EXISTS "source_url" text;
--> statement-breakpoint
ALTER TABLE "knowledge_files" ADD COLUMN IF NOT EXISTS "source_type" text;
--> statement-breakpoint
ALTER TABLE "knowledge_files" ADD COLUMN IF NOT EXISTS "language" text;
--> statement-breakpoint
ALTER TABLE "knowledge_files" ADD COLUMN IF NOT EXISTS "license" text;
--> statement-breakpoint
ALTER TABLE "knowledge_files" ADD COLUMN IF NOT EXISTS "copyright_status" text;
--> statement-breakpoint
ALTER TABLE "knowledge_files" ADD COLUMN IF NOT EXISTS "source_weight" real DEFAULT 1;
--> statement-breakpoint
ALTER TABLE "knowledge_files" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true;
--> statement-breakpoint
ALTER TABLE "knowledge_files" ADD COLUMN IF NOT EXISTS "checksum" text;
--> statement-breakpoint
ALTER TABLE "knowledge_files" ADD COLUMN IF NOT EXISTS "parser_version" text;
--> statement-breakpoint
ALTER TABLE "knowledge_files" ADD COLUMN IF NOT EXISTS "chunker_version" text;
--> statement-breakpoint
ALTER TABLE "knowledge_files" ADD COLUMN IF NOT EXISTS "embedding_model" text;
--> statement-breakpoint
ALTER TABLE "knowledge_files" ADD COLUMN IF NOT EXISTS "embedding_dimension" integer DEFAULT 4096;
--> statement-breakpoint
ALTER TABLE "knowledge_files" ADD COLUMN IF NOT EXISTS "metadata" jsonb DEFAULT '{}'::jsonb;
--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD COLUMN IF NOT EXISTS "language" text;
--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD COLUMN IF NOT EXISTS "source_type" text;
--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD COLUMN IF NOT EXISTS "section_title" text;
--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD COLUMN IF NOT EXISTS "section_path" text;
--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD COLUMN IF NOT EXISTS "symbol_terms" text[];
--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD COLUMN IF NOT EXISTS "tags" text[];
--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD COLUMN IF NOT EXISTS "chunk_type" text;
--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD COLUMN IF NOT EXISTS "token_count" integer;
--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD COLUMN IF NOT EXISTS "quality_score" real DEFAULT 1;
--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true;
--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD COLUMN IF NOT EXISTS "metadata" jsonb DEFAULT '{}'::jsonb;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_chunks_symbol_terms_idx"
ON "knowledge_chunks" USING gin ("symbol_terms");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_chunks_tags_idx"
ON "knowledge_chunks" USING gin ("tags");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_chunks_chunk_type_idx"
ON "knowledge_chunks" ("chunk_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_chunks_active_idx"
ON "knowledge_chunks" ("is_active", "source_type", "chunk_type");
