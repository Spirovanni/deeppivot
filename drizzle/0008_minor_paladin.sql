CREATE TABLE "recording_urls" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "recording_urls_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"sessionId" integer NOT NULL,
	"url" varchar(1024) NOT NULL,
	"source" varchar(50) DEFAULT 'vapi' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recording_urls" ADD CONSTRAINT "recording_urls_sessionId_interview_sessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."interview_sessions"("id") ON DELETE cascade ON UPDATE no action;