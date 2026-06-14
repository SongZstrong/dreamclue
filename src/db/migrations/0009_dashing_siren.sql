CREATE TABLE "dreams" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"mood" text,
	"tags" text[],
	"ai_analysis" text,
	"ai_analyzed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dreams" ADD CONSTRAINT "dreams_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dreams_user_id_idx" ON "dreams" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "dreams_created_at_idx" ON "dreams" USING btree ("created_at");