CREATE TABLE "career_archetypes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "career_archetypes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"archetypeName" varchar(100) NOT NULL,
	"traits" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"strengths" text[] DEFAULT '{}' NOT NULL,
	"growthAreas" text[] DEFAULT '{}' NOT NULL,
	"assessedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "career_archetypes_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
ALTER TABLE "career_archetypes" ADD CONSTRAINT "career_archetypes_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;