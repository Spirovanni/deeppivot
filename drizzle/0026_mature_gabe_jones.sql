CREATE TABLE "matching_feedback" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "matching_feedback_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"marketplaceApplicationId" integer NOT NULL,
	"outcome" varchar(20) NOT NULL,
	"hasResume" boolean NOT NULL,
	"hasCoverLetter" boolean NOT NULL,
	"resumeSkillsCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_matching_feedback_app" UNIQUE("marketplaceApplicationId")
);
--> statement-breakpoint
CREATE TABLE "matching_weights" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "matching_weights_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"key" varchar(80) NOT NULL,
	"weight" real DEFAULT 1 NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "matching_weights_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "matching_feedback" ADD CONSTRAINT "matching_feedback_marketplaceApplicationId_job_marketplace_applications_id_fk" FOREIGN KEY ("marketplaceApplicationId") REFERENCES "public"."job_marketplace_applications"("id") ON DELETE cascade ON UPDATE no action;