CREATE TABLE "foodLog" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"foodId" text NOT NULL,
	"datetime" timestamp DEFAULT now() NOT NULL,
	"quantityG" real NOT NULL,
	"calories" real NOT NULL,
	"protein" real NOT NULL,
	"carbs" real NOT NULL,
	"fat" real NOT NULL,
	"source" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "food" (
	"id" text PRIMARY KEY NOT NULL,
	"barcode" text,
	"name" text NOT NULL,
	"brand" text,
	"caloriesPer100g" real NOT NULL,
	"proteinPer100g" real NOT NULL,
	"carbsPer100g" real NOT NULL,
	"fatPer100g" real NOT NULL,
	"source" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "foodLog" ADD CONSTRAINT "foodLog_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "foodLog" ADD CONSTRAINT "foodLog_foodId_food_id_fk" FOREIGN KEY ("foodId") REFERENCES "public"."food"("id") ON DELETE no action ON UPDATE no action;