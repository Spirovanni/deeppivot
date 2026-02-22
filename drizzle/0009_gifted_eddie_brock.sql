CREATE TABLE "transcript_urls" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "transcript_urls_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"sessionId" integer NOT NULL,
	"url" varchar(1024) NOT NULL,
	"recordingUrlId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transcript_urls" ADD CONSTRAINT "transcript_urls_sessionId_interview_sessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."interview_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcript_urls" ADD CONSTRAINT "transcript_urls_recordingUrlId_recording_urls_id_fk" FOREIGN KEY ("recordingUrlId") REFERENCES "public"."recording_urls"("id") ON DELETE set null ON UPDATE no action;