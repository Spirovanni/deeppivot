CREATE TABLE "employer_job_invitations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "employer_job_invitations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"jobId" integer NOT NULL,
	"candidateUserId" integer NOT NULL,
	"invitedByUserId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_employer_invite_job_candidate" UNIQUE("jobId","candidateUserId")
);
--> statement-breakpoint
ALTER TABLE "employer_job_invitations" ADD CONSTRAINT "employer_job_invitations_jobId_jobs_id_fk" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employer_job_invitations" ADD CONSTRAINT "employer_job_invitations_candidateUserId_users_id_fk" FOREIGN KEY ("candidateUserId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employer_job_invitations" ADD CONSTRAINT "employer_job_invitations_invitedByUserId_users_id_fk" FOREIGN KEY ("invitedByUserId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;