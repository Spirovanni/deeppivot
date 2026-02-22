CREATE TABLE "interview_feedback" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "interview_feedback_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"sessionId" integer NOT NULL,
	"content" text NOT NULL,
	"sentimentScore" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "interview_feedback" ADD CONSTRAINT "interview_feedback_sessionId_interview_sessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."interview_sessions"("id") ON DELETE cascade ON UPDATE no action;