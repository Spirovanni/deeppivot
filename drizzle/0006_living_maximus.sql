CREATE TABLE "mentor_connections" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mentor_connections_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"mentorId" integer NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"message" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentors" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mentors_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"industry" varchar(100) NOT NULL,
	"expertise" text[] DEFAULT '{}' NOT NULL,
	"bio" text NOT NULL,
	"avatarUrl" varchar(1024),
	"contactUrl" varchar(1024),
	"linkedinUrl" varchar(1024),
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mentor_connections" ADD CONSTRAINT "mentor_connections_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_connections" ADD CONSTRAINT "mentor_connections_mentorId_mentors_id_fk" FOREIGN KEY ("mentorId") REFERENCES "public"."mentors"("id") ON DELETE cascade ON UPDATE no action;