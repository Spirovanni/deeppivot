CREATE TABLE "job_applications" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "job_applications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"company" varchar(255) NOT NULL,
	"position" varchar(255) NOT NULL,
	"location" varchar(255),
	"salary" varchar(255),
	"jobUrl" varchar(1024),
	"status" varchar(50) DEFAULT 'applied' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"description" text,
	"notes" text,
	"order" integer DEFAULT 0 NOT NULL,
	"columnId" integer NOT NULL,
	"userId" integer NOT NULL,
	"workflowId" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_boards" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "job_boards_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) DEFAULT 'Job Hunt' NOT NULL,
	"userId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_columns" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "job_columns_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"boardId" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_columnId_job_columns_id_fk" FOREIGN KEY ("columnId") REFERENCES "public"."job_columns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_boards" ADD CONSTRAINT "job_boards_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_columns" ADD CONSTRAINT "job_columns_boardId_job_boards_id_fk" FOREIGN KEY ("boardId") REFERENCES "public"."job_boards"("id") ON DELETE cascade ON UPDATE no action;