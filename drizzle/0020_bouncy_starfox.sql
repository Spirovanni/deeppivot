ALTER TABLE "interview_sessions" ADD COLUMN "jobDescriptionId" integer;--> statement-breakpoint
ALTER TABLE "interview_sessions" ADD COLUMN "resumeId" integer;--> statement-breakpoint
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_jobDescriptionId_job_descriptions_id_fk" FOREIGN KEY ("jobDescriptionId") REFERENCES "public"."job_descriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_resumeId_user_resumes_id_fk" FOREIGN KEY ("resumeId") REFERENCES "public"."user_resumes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "interview_sessions_job_desc_idx" ON "interview_sessions" USING btree ("jobDescriptionId");--> statement-breakpoint
CREATE INDEX "interview_sessions_resume_idx" ON "interview_sessions" USING btree ("resumeId");