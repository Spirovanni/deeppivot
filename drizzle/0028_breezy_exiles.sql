CREATE TABLE "notifications" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "notifications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"isRead" boolean DEFAULT false NOT NULL,
	"type" varchar(50) DEFAULT 'system' NOT NULL,
	"link" varchar(1024),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_resumes" ALTER COLUMN "parsedData" SET DEFAULT '{"fullName":"","email":null,"phone":null,"location":null,"summary":null,"skills":[],"workExperience":[],"education":[],"certifications":[],"yearsOfExperience":null}'::jsonb;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "notifications_user_read_idx" ON "notifications" USING btree ("userId","isRead");--> statement-breakpoint
CREATE INDEX "notifications_type_idx" ON "notifications" USING btree ("type");