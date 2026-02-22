CREATE TABLE "education_programs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "education_programs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"programType" varchar(50) DEFAULT 'bootcamp' NOT NULL,
	"duration" varchar(100) NOT NULL,
	"cost" integer DEFAULT 0 NOT NULL,
	"roiScore" integer,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"url" varchar(1024) NOT NULL,
	"description" text NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "funding_opportunities" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "funding_opportunities_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"fundingType" varchar(50) DEFAULT 'scholarship' NOT NULL,
	"amount" integer,
	"eligibilityText" text NOT NULL,
	"applicationUrl" varchar(1024) NOT NULL,
	"deadline" timestamp,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
