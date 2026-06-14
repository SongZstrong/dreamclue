CREATE TABLE "dreambook_queries" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"query" text NOT NULL,
	"result_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dreambook_queries" ADD CONSTRAINT "dreambook_queries_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dreambook_queries_user_id_idx" ON "dreambook_queries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "dreambook_queries_created_at_idx" ON "dreambook_queries" USING btree ("created_at");