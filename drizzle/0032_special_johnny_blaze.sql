CREATE TABLE "user_badges" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_badges_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"badgeId" varchar(64) NOT NULL,
	"unlockedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_badges_userId_badgeId_unique" UNIQUE("userId","badgeId")
);
--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_user_badges_user_id" ON "user_badges" USING btree ("userId");