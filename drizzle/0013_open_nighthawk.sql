CREATE TABLE "archetype_review_queue" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "archetype_review_queue_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"careerArchetypeId" integer NOT NULL,
	"sessionId" integer NOT NULL,
	"userId" integer NOT NULL,
	"feedbackContent" text NOT NULL,
	"aiArchetypeName" varchar(100) NOT NULL,
	"aiStrengths" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"aiGrowthAreas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"reviewedAt" timestamp,
	"reviewedBy" integer,
	"overrideArchetypeName" varchar(100),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "archetype_review_queue" ADD CONSTRAINT "archetype_review_queue_careerArchetypeId_career_archetypes_id_fk" FOREIGN KEY ("careerArchetypeId") REFERENCES "public"."career_archetypes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "archetype_review_queue" ADD CONSTRAINT "archetype_review_queue_sessionId_interview_sessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."interview_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "archetype_review_queue" ADD CONSTRAINT "archetype_review_queue_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "archetype_review_queue" ADD CONSTRAINT "archetype_review_queue_reviewedBy_users_id_fk" FOREIGN KEY ("reviewedBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;