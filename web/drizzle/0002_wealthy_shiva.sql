CREATE TABLE "weightLog" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"date" date NOT NULL,
	"weightKg" real NOT NULL,
	"isUnreliable" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "weightLog_userId_date_unique" UNIQUE("userId","date")
);
--> statement-breakpoint
ALTER TABLE "weightLog" ADD CONSTRAINT "weightLog_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;