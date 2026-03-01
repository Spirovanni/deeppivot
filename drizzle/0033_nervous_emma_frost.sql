CREATE TABLE "gamification_events" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "gamification_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"eventType" varchar(64) NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gamification_events" ADD CONSTRAINT "gamification_events_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_gamification_events_user_id" ON "gamification_events" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_gamification_events_type" ON "gamification_events" USING btree ("eventType");--> statement-breakpoint
CREATE INDEX "idx_gamification_events_created_at" ON "gamification_events" USING btree ("createdAt");