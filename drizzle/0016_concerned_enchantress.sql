CREATE INDEX "agent_configs_user_idx" ON "agent_configs" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "agent_configs_type_idx" ON "agent_configs" USING btree ("interviewType");--> statement-breakpoint
CREATE INDEX "companies_owner_idx" ON "companies" USING btree ("ownerUserId");--> statement-breakpoint
CREATE INDEX "interview_sessions_user_idx" ON "interview_sessions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "interview_sessions_status_idx" ON "interview_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "job_applications_user_column_idx" ON "job_applications" USING btree ("userId","columnId");--> statement-breakpoint
CREATE INDEX "job_applications_status_idx" ON "job_applications" USING btree ("status");