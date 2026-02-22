CREATE TABLE "emotional_analysis" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "emotional_analysis_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"sessionId" integer NOT NULL,
	"jobId" varchar(255) NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "emotional_analysis" ADD CONSTRAINT "emotional_analysis_sessionId_interview_sessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."interview_sessions"("id") ON DELETE cascade ON UPDATE no action;