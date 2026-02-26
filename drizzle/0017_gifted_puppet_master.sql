ALTER TABLE "career_milestones" ADD COLUMN "organizationId" varchar(255);--> statement-breakpoint
ALTER TABLE "interview_sessions" ADD COLUMN "organizationId" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "organizationId" varchar(255);--> statement-breakpoint
CREATE INDEX "interview_sessions_org_idx" ON "interview_sessions" USING btree ("organizationId");