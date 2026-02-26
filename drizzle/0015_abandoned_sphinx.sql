CREATE TABLE "companies" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "companies_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"ownerUserId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"logoUrl" varchar(1024),
	"website" varchar(1024),
	"description" text,
	"size" varchar(50),
	"industry" varchar(100),
	"location" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_marketplace_applications" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "job_marketplace_applications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"jobId" integer NOT NULL,
	"userId" integer NOT NULL,
	"resumeUrl" varchar(1024),
	"coverLetter" text,
	"status" varchar(20) DEFAULT 'new' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_marketplace_app_job_user" UNIQUE("jobId","userId")
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "jobs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"companyId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"location" varchar(255),
	"jobType" varchar(50) DEFAULT 'full_time' NOT NULL,
	"experienceLevel" varchar(50) DEFAULT 'mid' NOT NULL,
	"salaryMin" integer,
	"salaryMax" integer,
	"remoteFlag" boolean DEFAULT false NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentor_feedback" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mentor_feedback_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"sessionId" integer NOT NULL,
	"mentorUserId" integer NOT NULL,
	"comment" text NOT NULL,
	"rating" integer,
	"isPrivate" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "career_milestones" ADD COLUMN "deletedAt" timestamp;--> statement-breakpoint
ALTER TABLE "interview_sessions" ADD COLUMN "deletedAt" timestamp;--> statement-breakpoint
ALTER TABLE "job_applications" ADD COLUMN "sourceType" varchar(20) DEFAULT 'external' NOT NULL;--> statement-breakpoint
ALTER TABLE "job_applications" ADD COLUMN "marketplaceJobId" integer;--> statement-breakpoint
ALTER TABLE "job_applications" ADD COLUMN "marketplaceApplicationId" integer;--> statement-breakpoint
ALTER TABLE "mentors" ADD COLUMN "userId" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatarUrl" varchar(1024);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pronouns" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "linkedinUrl" varchar(1024);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "wdbSalesforceContactId" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "wdbCasePlanId" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "wdbEnrolledAt" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deletedAt" timestamp;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_ownerUserId_users_id_fk" FOREIGN KEY ("ownerUserId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_marketplace_applications" ADD CONSTRAINT "job_marketplace_applications_jobId_jobs_id_fk" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_marketplace_applications" ADD CONSTRAINT "job_marketplace_applications_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_companyId_companies_id_fk" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_feedback" ADD CONSTRAINT "mentor_feedback_sessionId_interview_sessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."interview_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_feedback" ADD CONSTRAINT "mentor_feedback_mentorUserId_users_id_fk" FOREIGN KEY ("mentorUserId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_marketplaceJobId_jobs_id_fk" FOREIGN KEY ("marketplaceJobId") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_marketplaceApplicationId_job_marketplace_applications_id_fk" FOREIGN KEY ("marketplaceApplicationId") REFERENCES "public"."job_marketplace_applications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentors" ADD CONSTRAINT "mentors_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;