CREATE TABLE "toast_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"error_type" text NOT NULL,
	"error_message" text NOT NULL,
	"toast_title" text,
	"toast_description" text,
	"url" text NOT NULL,
	"user_agent" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by_id" integer,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "proxy_accounts" ADD COLUMN "child_first_name" text;--> statement-breakpoint
ALTER TABLE "proxy_accounts" ADD COLUMN "child_last_name" text;--> statement-breakpoint
ALTER TABLE "proxy_accounts" ADD COLUMN "kids_username" text;--> statement-breakpoint
ALTER TABLE "proxy_accounts" ADD COLUMN "kids_email" text;--> statement-breakpoint
ALTER TABLE "proxy_accounts" ADD COLUMN "kids_user_id" integer;--> statement-breakpoint
ALTER TABLE "proxy_accounts" ADD COLUMN "kids_verification_document_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "source_of_income_document_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "id_document_front_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "id_document_back_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "id_selfie_url" text;--> statement-breakpoint
ALTER TABLE "toast_reports" ADD CONSTRAINT "toast_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "toast_reports" ADD CONSTRAINT "toast_reports_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "toast_reports_user_id_idx" ON "toast_reports" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "toast_reports_status_idx" ON "toast_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "toast_reports_created_at_idx" ON "toast_reports" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "proxy_accounts" ADD CONSTRAINT "proxy_accounts_kids_user_id_users_id_fk" FOREIGN KEY ("kids_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;