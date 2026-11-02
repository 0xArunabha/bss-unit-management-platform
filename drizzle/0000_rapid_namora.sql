CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"actor_id" uuid,
	"target_id" uuid,
	"amount" numeric(12, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "circulars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"category" text NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"author_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "donations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"donor_name" text NOT NULL,
	"donor_phone" text,
	"amount" numeric(12, 2) NOT NULL,
	"event_id" uuid,
	"payment_mode" text DEFAULT 'cash' NOT NULL,
	"transaction_ref" text,
	"receipt_no" text NOT NULL,
	"sms_sent" boolean DEFAULT false NOT NULL,
	"received_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "donations_receipt_no_unique" UNIQUE("receipt_no"),
	CONSTRAINT "positive_donation" CHECK ("donations"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "membership_dues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"dues_month" integer NOT NULL,
	"dues_year" integer NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"payment_mode" text DEFAULT 'cash' NOT NULL,
	"collected_by" uuid,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "minimum_dues" CHECK ("membership_dues"."amount" >= 20),
	CONSTRAINT "dues_valid_month" CHECK ("membership_dues"."dues_month" between 1 and 12)
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"location" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"category" text NOT NULL,
	"volunteers" integer DEFAULT 0 NOT NULL,
	"image" text DEFAULT '/images/science-outreach.jpg' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_procurements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"item_name" text NOT NULL,
	"quantity" text NOT NULL,
	"estimated_cost" numeric(12, 2) NOT NULL,
	"actual_cost" numeric(12, 2),
	"status" text DEFAULT 'needed' NOT NULL,
	"purchased_by" uuid,
	"purchased_at" timestamp with time zone,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"created_by" uuid,
	"receipt_photo_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "different_verifier" CHECK ("event_procurements"."verified_by" is null or "event_procurements"."verified_by" != "event_procurements"."purchased_by"),
	CONSTRAINT "procurement_state" CHECK ("event_procurements"."status" in ('needed', 'purchased', 'verified')),
	CONSTRAINT "exact_purchase_required" CHECK ("event_procurements"."status" = 'needed' or ("event_procurements"."actual_cost" is not null and "event_procurements"."purchased_by" is not null)),
	CONSTRAINT "verification_required" CHECK ("event_procurements"."status" != 'verified' or "event_procurements"."verified_by" is not null),
	CONSTRAINT "nonnegative_spend" CHECK ("event_procurements"."actual_cost" is null or "event_procurements"."actual_cost" >= 0)
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"phone" text,
	"role" text DEFAULT 'member' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"monthly_pledge" numeric(12, 2) DEFAULT 20 NOT NULL,
	"avatar_color" text DEFAULT 'peach' NOT NULL,
	"unpaid_months" integer DEFAULT 0 NOT NULL,
	"pin" text DEFAULT '1234' NOT NULL,
	"google_email" text,
	"needs_pin_change" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "minimum_pledge" CHECK ("profiles"."monthly_pledge" >= 20),
	CONSTRAINT "profile_role" CHECK ("profiles"."role" in ('admin', 'organizer', 'volunteer', 'member')),
	CONSTRAINT "profile_status" CHECK ("profiles"."status" in ('active', 'inactive'))
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_actor_id_profiles_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "circulars" ADD CONSTRAINT "circulars_author_id_profiles_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_received_by_profiles_id_fk" FOREIGN KEY ("received_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_dues" ADD CONSTRAINT "membership_dues_member_id_profiles_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_dues" ADD CONSTRAINT "membership_dues_collected_by_profiles_id_fk" FOREIGN KEY ("collected_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_procurements" ADD CONSTRAINT "event_procurements_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_procurements" ADD CONSTRAINT "event_procurements_purchased_by_profiles_id_fk" FOREIGN KEY ("purchased_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_procurements" ADD CONSTRAINT "event_procurements_verified_by_profiles_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_procurements" ADD CONSTRAINT "event_procurements_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "member_month_year" ON "membership_dues" USING btree ("member_id","dues_month","dues_year");