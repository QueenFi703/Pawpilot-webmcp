CREATE TABLE "care_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"pet_id" text NOT NULL,
	"title" text NOT NULL,
	"plan" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "care_plans_pet_id_created_at_idx" ON "care_plans" ("pet_id","created_at");