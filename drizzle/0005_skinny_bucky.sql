CREATE TABLE "career_milestones" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "career_milestones_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"targetDate" timestamp,
	"status" varchar(20) DEFAULT 'planned' NOT NULL,
	"orderIndex" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "career_resources" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "career_resources_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"milestoneId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"url" varchar(1024) NOT NULL,
	"resourceType" varchar(50) DEFAULT 'article' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "career_milestones" ADD CONSTRAINT "career_milestones_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_resources" ADD CONSTRAINT "career_resources_milestoneId_career_milestones_id_fk" FOREIGN KEY ("milestoneId") REFERENCES "public"."career_milestones"("id") ON DELETE cascade ON UPDATE no action;