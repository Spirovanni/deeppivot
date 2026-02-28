CREATE TABLE "cover_letters" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "cover_letters_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"jobDescriptionId" integer NOT NULL,
	"resumeId" integer,
	"content" text NOT NULL,
	"tone" varchar(50) DEFAULT 'professional' NOT NULL,
	"status" varchar(50) DEFAULT 'generated' NOT NULL,
	"fileUrl" varchar(1024),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cover_letters" ADD CONSTRAINT "cover_letters_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cover_letters" ADD CONSTRAINT "cover_letters_jobDescriptionId_job_descriptions_id_fk" FOREIGN KEY ("jobDescriptionId") REFERENCES "public"."job_descriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cover_letters" ADD CONSTRAINT "cover_letters_resumeId_user_resumes_id_fk" FOREIGN KEY ("resumeId") REFERENCES "public"."user_resumes"("id") ON DELETE set null ON UPDATE no action;