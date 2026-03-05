-- Store ElevenLabs (and other) live transcripts for on-demand feedback generation
CREATE TABLE IF NOT EXISTS "session_transcripts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY NOT NULL,
	"sessionId" integer NOT NULL,
	"messages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"source" varchar(50) DEFAULT 'elevenlabs' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "session_transcripts_session_id_unique" UNIQUE("sessionId")
);
--> statement-breakpoint
ALTER TABLE "session_transcripts" ADD CONSTRAINT "session_transcripts_sessionId_interview_sessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."interview_sessions"("id") ON DELETE cascade ON UPDATE no action;
