CREATE TABLE "user_gamification" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_gamification_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"currentStreak" integer DEFAULT 0 NOT NULL,
	"highestStreak" integer DEFAULT 0 NOT NULL,
	"lastActivityAt" timestamp,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_gamification_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
ALTER TABLE "user_gamification" ADD CONSTRAINT "user_gamification_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;