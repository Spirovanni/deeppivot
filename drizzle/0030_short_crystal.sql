CREATE TABLE "user_announcement_dismissals" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_announcement_dismissals_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"announcementId" integer NOT NULL,
	"dismissedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_announcement_dismissals_user_announcement" UNIQUE("userId","announcementId")
);
--> statement-breakpoint
ALTER TABLE "admin_announcements" ADD COLUMN "sendToHome" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_announcement_dismissals" ADD CONSTRAINT "user_announcement_dismissals_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_announcement_dismissals" ADD CONSTRAINT "user_announcement_dismissals_announcementId_admin_announcements_id_fk" FOREIGN KEY ("announcementId") REFERENCES "public"."admin_announcements"("id") ON DELETE cascade ON UPDATE no action;