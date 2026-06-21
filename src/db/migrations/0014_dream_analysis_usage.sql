CREATE TABLE IF NOT EXISTS "dream_analysis_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"dream_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dream_analysis_usage" ADD CONSTRAINT "dream_analysis_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "dream_analysis_usage" ADD CONSTRAINT "dream_analysis_usage_dream_id_dreams_id_fk" FOREIGN KEY ("dream_id") REFERENCES "public"."dreams"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dream_analysis_usage_user_id_idx" ON "dream_analysis_usage" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dream_analysis_usage_dream_id_idx" ON "dream_analysis_usage" USING btree ("dream_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dream_analysis_usage_created_at_idx" ON "dream_analysis_usage" USING btree ("created_at");
