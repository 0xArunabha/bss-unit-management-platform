CREATE TABLE "action_idempotency" (
	"key" text PRIMARY KEY NOT NULL,
	"action" text NOT NULL,
	"user_id" uuid,
	"response_payload" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "pin" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "pin" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "needs_pin_change" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "donations" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
ALTER TABLE "membership_dues" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
ALTER TABLE "action_idempotency" ADD CONSTRAINT "action_idempotency_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_idempotency_key_unique" UNIQUE("idempotency_key");--> statement-breakpoint
ALTER TABLE "membership_dues" ADD CONSTRAINT "membership_dues_idempotency_key_unique" UNIQUE("idempotency_key");