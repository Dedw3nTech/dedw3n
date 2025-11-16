CREATE TYPE "public"."account_type" AS ENUM('checking', 'savings');--> statement-breakpoint
CREATE TYPE "public"."advertisement_placement" AS ENUM('marketplace', 'community', 'dating', 'all');--> statement-breakpoint
CREATE TYPE "public"."advertisement_status" AS ENUM('active', 'paused', 'expired', 'pending', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."advertisement_type" AS ENUM('banner', 'sidebar', 'popup', 'native', 'video');--> statement-breakpoint
CREATE TYPE "public"."affiliate_status" AS ENUM('active', 'pending', 'suspended', 'terminated');--> statement-breakpoint
CREATE TYPE "public"."affiliate_tier" AS ENUM('bronze', 'silver', 'gold', 'platinum', 'diamond');--> statement-breakpoint
CREATE TYPE "public"."analytics_period" AS ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."budget_type" AS ENUM('daily', 'total', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."business_type" AS ENUM('individual', 'business', 'corporation');--> statement-breakpoint
CREATE TYPE "public"."calendar_event_category" AS ENUM('dating', 'marketplace', 'community', 'finance', 'government', 'lifestyle', 'services', 'appointment', 'personal', 'work', 'social', 'delivery', 'payment', 'meeting');--> statement-breakpoint
CREATE TYPE "public"."calendar_event_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'active', 'paused', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."campaign_type" AS ENUM('awareness', 'conversion', 'retention', 'engagement', 'lead_generation');--> statement-breakpoint
CREATE TYPE "public"."chatroom_type" AS ENUM('global', 'regional', 'country', 'private');--> statement-breakpoint
CREATE TYPE "public"."commission_status" AS ENUM('pending', 'sent', 'paid', 'overdue', 'failed');--> statement-breakpoint
CREATE TYPE "public"."commission_tier" AS ENUM('standard', 'premium', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."conversion_type" AS ENUM('view', 'add_to_cart', 'checkout', 'purchase', 'search');--> statement-breakpoint
CREATE TYPE "public"."crypto_payment_status" AS ENUM('pending', 'confirmed', 'failed', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."dating_subscription" AS ENUM('normal', 'vip', 'vvip');--> statement-breakpoint
CREATE TYPE "public"."demographic_type" AS ENUM('age_group', 'gender', 'location', 'income_level');--> statement-breakpoint
CREATE TYPE "public"."device_type" AS ENUM('desktop', 'mobile', 'tablet');--> statement-breakpoint
CREATE TYPE "public"."discount_application" AS ENUM('automatic', 'code_required');--> statement-breakpoint
CREATE TYPE "public"."discount_status" AS ENUM('active', 'inactive', 'expired', 'scheduled');--> statement-breakpoint
CREATE TYPE "public"."discount_type" AS ENUM('percentage', 'fixed_amount', 'buy_x_get_y', 'free_shipping');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('passport', 'drivers_license', 'national_id', 'proof_of_address', 'business_registration', 'tax_certificate', 'bank_statement', 'articles_of_incorporation', 'beneficial_ownership');--> statement-breakpoint
CREATE TYPE "public"."event_category" AS ENUM('networking', 'social', 'business', 'tech', 'sports', 'arts', 'education', 'health', 'food', 'community');--> statement-breakpoint
CREATE TYPE "public"."flagged_content_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."flagged_content_type" AS ENUM('post', 'comment', 'message', 'product', 'profile', 'community');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TYPE "public"."gift_card_design" AS ENUM('classic_blue', 'elegant_gold', 'festive_red', 'modern_purple', 'nature_green', 'luxury_black', 'premium_silver', 'exclusive_diamond');--> statement-breakpoint
CREATE TYPE "public"."gift_card_status" AS ENUM('active', 'redeemed', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."gift_card_transaction_type" AS ENUM('purchase', 'redemption', 'refund');--> statement-breakpoint
CREATE TYPE "public"."gift_status" AS ENUM('pending', 'accepted', 'rejected', 'paid');--> statement-breakpoint
CREATE TYPE "public"."interaction_type" AS ENUM('view', 'search', 'purchase', 'like', 'cart', 'share', 'compare');--> statement-breakpoint
CREATE TYPE "public"."kyc_document_type" AS ENUM('passport', 'national_id', 'drivers_license');--> statement-breakpoint
CREATE TYPE "public"."kyc_status" AS ENUM('pending', 'verified', 'rejected', 'not_submitted');--> statement-breakpoint
CREATE TYPE "public"."kyc_verification_status" AS ENUM('not_started', 'pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."marketing_channel" AS ENUM('social_media', 'email', 'sms', 'google_ads', 'facebook_ads', 'instagram_ads', 'youtube_ads', 'linkedin_ads', 'twitter_ads', 'tiktok_ads', 'snapchat_ads', 'display_ads', 'search_ads', 'influencer', 'affiliate', 'content_marketing', 'direct_mail', 'print_ads', 'radio', 'tv', 'podcast', 'webinar', 'event', 'referral', 'organic_search', 'word_of_mouth', 'other');--> statement-breakpoint
CREATE TYPE "public"."marketplace_type" AS ENUM('c2c', 'b2c', 'b2b', 'raw', 'rqst');--> statement-breakpoint
CREATE TYPE "public"."message_category" AS ENUM('marketplace', 'community', 'dating');--> statement-breakpoint
CREATE TYPE "public"."moderation_match_type" AS ENUM('exact', 'partial', 'regex');--> statement-breakpoint
CREATE TYPE "public"."moderation_severity" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('app', 'email', 'push', 'sms');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('like', 'comment', 'follow', 'mention', 'message', 'order', 'payment', 'system', 'gift_received', 'finance', 'government', 'lifestyle', 'marketplace', 'community');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('bank', 'mobile_money', 'paypal');--> statement-breakpoint
CREATE TYPE "public"."payment_schedule" AS ENUM('daily', 'weekly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('active', 'draft', 'archived');--> statement-breakpoint
CREATE TYPE "public"."product_type" AS ENUM('product', 'service', 'vehicle', 'real_estate');--> statement-breakpoint
CREATE TYPE "public"."promotion_target" AS ENUM('all_products', 'specific_products', 'category', 'minimum_order');--> statement-breakpoint
CREATE TYPE "public"."proxy_account_status" AS ENUM('pending', 'under_review', 'verified', 'rejected', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."proxy_account_type" AS ENUM('kids', 'organization', 'company');--> statement-breakpoint
CREATE TYPE "public"."region" AS ENUM('Africa', 'South Asia', 'East Asia', 'Oceania', 'North America', 'Central America', 'South America', 'Middle East', 'Europe', 'Central Asia');--> statement-breakpoint
CREATE TYPE "public"."return_reason" AS ENUM('defective', 'wrong_item', 'not_as_described', 'changed_mind', 'damaged_in_shipping', 'other');--> statement-breakpoint
CREATE TYPE "public"."return_status" AS ENUM('requested', 'approved', 'rejected', 'processing', 'shipped', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."risk_level" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."store_user_role" AS ENUM('marketer', 'merchandiser', 'manager');--> statement-breakpoint
CREATE TYPE "public"."traffic_source" AS ENUM('direct', 'search', 'social', 'email', 'referral', 'paid');--> statement-breakpoint
CREATE TYPE "public"."vendor_account_status" AS ENUM('active', 'on_hold', 'suspended', 'permanently_suspended');--> statement-breakpoint
CREATE TYPE "public"."vendor_badge_level" AS ENUM('new_vendor', 'level_2_vendor', 'top_vendor', 'infinity_vendor', 'elite_vendor');--> statement-breakpoint
CREATE TYPE "public"."video_monetization" AS ENUM('free', 'ppv', 'subscription');--> statement-breakpoint
CREATE TABLE "advertisement_clicks" (
	"id" serial PRIMARY KEY NOT NULL,
	"advertisement_id" integer NOT NULL,
	"user_id" integer,
	"ip_address" varchar(45),
	"user_agent" text,
	"referer" text,
	"clicked_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "advertisement_impressions" (
	"id" serial PRIMARY KEY NOT NULL,
	"advertisement_id" integer NOT NULL,
	"user_id" integer,
	"ip_address" varchar(45),
	"user_agent" text,
	"page" varchar(255),
	"viewed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "advertisements" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"image_url" text,
	"video_url" text,
	"link_url" text NOT NULL,
	"placement" "advertisement_placement" NOT NULL,
	"type" "advertisement_type" NOT NULL,
	"status" "advertisement_status" DEFAULT 'pending',
	"advertiser_name" varchar(255) NOT NULL,
	"advertiser_email" varchar(255) NOT NULL,
	"advertiser_phone" varchar(50),
	"advertiser_company" varchar(255),
	"advertiser_address" text,
	"budget" numeric(10, 2) NOT NULL,
	"spent_amount" numeric(10, 2) DEFAULT '0',
	"cost_per_click" numeric(10, 4),
	"cost_per_impression" numeric(10, 4),
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"target_audience" json,
	"keywords" json,
	"impressions" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "affiliate_partners" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"company" varchar(255),
	"website" varchar(500),
	"partner_code" varchar(50) NOT NULL,
	"description" text,
	"specialization" varchar(100),
	"region" varchar(100),
	"languages" json DEFAULT '[]'::json,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"is_verified" boolean DEFAULT false,
	"verification_date" timestamp,
	"commission_rate" numeric(5, 4) DEFAULT '0.30',
	"total_referrals" integer DEFAULT 0,
	"total_commission_earned" numeric(10, 2) DEFAULT '0',
	"assigned_vendors" integer[] DEFAULT '{}',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "affiliate_partners_email_unique" UNIQUE("email"),
	CONSTRAINT "affiliate_partners_partner_code_unique" UNIQUE("partner_code")
);
--> statement-breakpoint
CREATE TABLE "allow_list" (
	"id" serial PRIMARY KEY NOT NULL,
	"term" text NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"description" text,
	"added_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "allow_list_term_unique" UNIQUE("term")
);
--> statement-breakpoint
CREATE TABLE "audio_session_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"is_muted" boolean DEFAULT false,
	"is_deafened" boolean DEFAULT false,
	"joined_at" timestamp DEFAULT now(),
	"left_at" timestamp,
	CONSTRAINT "audio_session_participants_session_id_user_id_unique" UNIQUE("session_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "audio_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"chatroom_id" integer NOT NULL,
	"session_id" text NOT NULL,
	"host_id" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"participant_count" integer DEFAULT 0,
	"max_participants" integer DEFAULT 10,
	"started_at" timestamp DEFAULT now(),
	"ended_at" timestamp,
	CONSTRAINT "audio_sessions_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "auth_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" varchar(128) NOT NULL,
	"client_id" varchar(100),
	"device_type" varchar(50),
	"device_info" varchar(512),
	"ip_address" varchar(50),
	"last_active_at" timestamp DEFAULT now(),
	"expires_at" timestamp NOT NULL,
	"is_revoked" boolean DEFAULT false,
	"revoked_reason" varchar(100),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "auth_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "block_list" (
	"id" serial PRIMARY KEY NOT NULL,
	"term" text NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"match_type" "moderation_match_type" DEFAULT 'exact' NOT NULL,
	"severity" "moderation_severity" DEFAULT 'medium' NOT NULL,
	"description" text,
	"added_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "block_list_term_unique" UNIQUE("term")
);
--> statement-breakpoint
CREATE TABLE "calendar_event_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"role" text DEFAULT 'attendee',
	"response_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "calendar_event_participants_event_id_user_id_unique" UNIQUE("event_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "calendar_event_reminders" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"reminder_time" timestamp NOT NULL,
	"reminder_type" text DEFAULT 'notification',
	"is_sent" boolean DEFAULT false,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" "calendar_event_category" NOT NULL,
	"priority" "calendar_event_priority" DEFAULT 'medium',
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"is_all_day" boolean DEFAULT false,
	"timezone" text DEFAULT 'UTC',
	"location" text,
	"people" text,
	"is_online" boolean DEFAULT false,
	"meeting_link" text,
	"related_type" text,
	"related_id" integer,
	"participants" json,
	"is_recurring" boolean DEFAULT false,
	"recurrence_rule" text,
	"parent_event_id" integer,
	"reminder_minutes" integer DEFAULT 30,
	"has_notified" boolean DEFAULT false,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"is_cancelled" boolean DEFAULT false,
	"color" text,
	"notes" text,
	"attachments" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "call_metadata" (
	"id" serial PRIMARY KEY NOT NULL,
	"call_session_id" integer NOT NULL,
	"metadata" json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "call_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"call_id" text NOT NULL,
	"initiator_id" integer NOT NULL,
	"receiver_id" integer NOT NULL,
	"call_type" text NOT NULL,
	"status" text NOT NULL,
	"started_at" timestamp DEFAULT now(),
	"ended_at" timestamp,
	"duration" integer DEFAULT 0,
	"quality" text
);
--> statement-breakpoint
CREATE TABLE "campaign_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"channel" "marketing_channel" NOT NULL,
	"content" text,
	"media_urls" json,
	"target_url" varchar(500),
	"call_to_action" varchar(100),
	"budget_allocated" numeric(10, 2),
	"actual_spend" numeric(10, 2) DEFAULT '0',
	"scheduled_date" timestamp,
	"published_date" timestamp,
	"impressions" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"engagements" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"revenue" numeric(10, 2) DEFAULT '0',
	"click_through_rate" numeric(5, 4),
	"conversion_rate" numeric(5, 4),
	"cost_per_click" numeric(10, 2),
	"cost_per_conversion" numeric(10, 2),
	"return_on_ad_spend" numeric(5, 2),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campaign_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"date" date NOT NULL,
	"period" varchar(20) NOT NULL,
	"impressions" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"engagements" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"revenue" numeric(10, 2) DEFAULT '0',
	"cost" numeric(10, 2) DEFAULT '0',
	"click_through_rate" numeric(5, 4),
	"conversion_rate" numeric(5, 4),
	"cost_per_click" numeric(10, 2),
	"cost_per_conversion" numeric(10, 2),
	"return_on_ad_spend" numeric(5, 2),
	"reach" integer DEFAULT 0,
	"frequency" numeric(3, 2),
	"new_visitors" integer DEFAULT 0,
	"returning_visitors" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campaign_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"featured" boolean DEFAULT false,
	"discount_offered" numeric(5, 2),
	"promotional_price" numeric(10, 2),
	"impressions" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"views" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"revenue" numeric(10, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campaign_touchpoints" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"activity_id" integer,
	"user_id" integer,
	"touchpoint_type" varchar(50) NOT NULL,
	"channel" "marketing_channel" NOT NULL,
	"source" varchar(100),
	"medium" varchar(100),
	"is_first_touch" boolean DEFAULT false,
	"is_last_touch" boolean DEFAULT false,
	"attribution_weight" numeric(3, 2) DEFAULT '1.00',
	"conversion_value" numeric(10, 2),
	"product_id" integer,
	"session_id" varchar(100),
	"ip_address" varchar(45),
	"user_agent" text,
	"referrer_url" text,
	"landing_page_url" text,
	"metadata" json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chatroom_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"chatroom_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"joined_at" timestamp DEFAULT now(),
	"last_seen_at" timestamp DEFAULT now(),
	"is_moderator" boolean DEFAULT false,
	"is_online" boolean DEFAULT false,
	CONSTRAINT "chatroom_members_chatroom_id_user_id_unique" UNIQUE("chatroom_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "chatroom_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"chatroom_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"content" text NOT NULL,
	"message_type" text DEFAULT 'text',
	"is_deleted" boolean DEFAULT false,
	"edited_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chatrooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" "chatroom_type" NOT NULL,
	"region" text,
	"country" text,
	"creator_id" integer,
	"is_active" boolean DEFAULT true,
	"max_users" integer DEFAULT 1000,
	"is_audio_enabled" boolean DEFAULT false,
	"is_video_enabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"country" text NOT NULL,
	"region" text NOT NULL,
	"population" integer,
	"latitude" double precision,
	"longitude" double precision,
	"timezone" text,
	"is_capital" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "community_event_attendees" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"attended_at" timestamp DEFAULT now(),
	CONSTRAINT "community_event_attendees_event_id_user_id_unique" UNIQUE("event_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "community_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"date" date NOT NULL,
	"time" text NOT NULL,
	"location" text NOT NULL,
	"category" "event_category",
	"max_attendees" integer,
	"organizer_id" integer NOT NULL,
	"tags" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "competitor_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer NOT NULL,
	"competitor_vendor_id" integer NOT NULL,
	"category" text NOT NULL,
	"average_price" double precision DEFAULT 0,
	"total_products" integer DEFAULT 0,
	"monthly_revenue" double precision DEFAULT 0,
	"market_share" double precision DEFAULT 0,
	"rating" double precision DEFAULT 0,
	"review_count" integer DEFAULT 0,
	"analyzed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversion_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer NOT NULL,
	"product_id" integer,
	"user_id" integer,
	"session_id" text,
	"conversion_type" "conversion_type" NOT NULL,
	"value" double precision DEFAULT 0,
	"currency" text DEFAULT 'GBP',
	"device_type" "device_type" NOT NULL,
	"traffic_source" "traffic_source" NOT NULL,
	"conversion_path" json,
	"time_to_conversion" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crypto_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"payment_id" varchar(100) NOT NULL,
	"order_id" integer,
	"user_id" integer,
	"amount" double precision NOT NULL,
	"currency" varchar(10) NOT NULL,
	"exchange_rate" double precision NOT NULL,
	"amount_in_crypto" double precision NOT NULL,
	"wallet_address" varchar(255) NOT NULL,
	"status" "crypto_payment_status" DEFAULT 'pending' NOT NULL,
	"transaction_hash" varchar(255),
	"confirmations" integer DEFAULT 0,
	"required_confirmations" integer DEFAULT 3,
	"expires_at" timestamp NOT NULL,
	"confirmed_at" timestamp,
	"metadata" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "crypto_payments_payment_id_unique" UNIQUE("payment_id")
);
--> statement-breakpoint
CREATE TABLE "dating_likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"liker_id" integer NOT NULL,
	"liked_id" integer NOT NULL,
	"is_like" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "dating_likes_liker_id_liked_id_unique" UNIQUE("liker_id","liked_id")
);
--> statement-breakpoint
CREATE TABLE "dating_matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"user1_id" integer NOT NULL,
	"user2_id" integer NOT NULL,
	"matched_at" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true,
	"last_message_at" timestamp,
	CONSTRAINT "dating_matches_user1_id_user2_id_unique" UNIQUE("user1_id","user2_id")
);
--> statement-breakpoint
CREATE TABLE "dating_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"display_name" text NOT NULL,
	"age" integer NOT NULL,
	"gender" text,
	"sexual_orientation" text,
	"height" text,
	"income_range" text,
	"bio" text,
	"location" text,
	"interests" text[],
	"looking_for" text,
	"relationship_type" text,
	"profile_images" text[],
	"is_active" boolean DEFAULT false,
	"is_premium" boolean DEFAULT false,
	"dating_room_tier" text DEFAULT 'normal',
	"country" text,
	"region" text,
	"city" text,
	"tribe" text,
	"language" text,
	"secondary_language" text,
	"income" text,
	"education" text,
	"roots" text,
	"selected_gifts" integer[] DEFAULT '{}',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "dating_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "demographic_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer NOT NULL,
	"period" "analytics_period" NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"age_group" text NOT NULL,
	"gender" "gender",
	"country" text,
	"region" text,
	"income_level" text,
	"total_users" integer DEFAULT 0,
	"total_orders" integer DEFAULT 0,
	"total_revenue" double precision DEFAULT 0,
	"average_order_value" double precision DEFAULT 0,
	"conversion_rate" double precision DEFAULT 0,
	"return_rate" double precision DEFAULT 0,
	"lifetime_value" double precision DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discount_usages" (
	"id" serial PRIMARY KEY NOT NULL,
	"discount_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"order_id" integer,
	"discount_amount" double precision NOT NULL,
	"original_amount" double precision NOT NULL,
	"final_amount" double precision NOT NULL,
	"used_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "financial_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer NOT NULL,
	"period" "analytics_period" NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"gross_revenue" double precision DEFAULT 0,
	"net_revenue" double precision DEFAULT 0,
	"total_costs" double precision DEFAULT 0,
	"platform_fees" double precision DEFAULT 0,
	"shipping_costs" double precision DEFAULT 0,
	"marketing_costs" double precision DEFAULT 0,
	"gross_profit" double precision DEFAULT 0,
	"net_profit" double precision DEFAULT 0,
	"profit_margin" double precision DEFAULT 0,
	"average_order_value" double precision DEFAULT 0,
	"total_orders" integer DEFAULT 0,
	"total_refunds" double precision DEFAULT 0,
	"refund_rate" double precision DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_services" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"service_type" text NOT NULL,
	"service_name" text NOT NULL,
	"status" text DEFAULT 'interested' NOT NULL,
	"application_data" json,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"approved_at" timestamp,
	"rejected_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "flagged_content" (
	"id" serial PRIMARY KEY NOT NULL,
	"content_type" "flagged_content_type" NOT NULL,
	"content_id" integer NOT NULL,
	"reason" text NOT NULL,
	"status" "flagged_content_status" DEFAULT 'pending' NOT NULL,
	"reported_by" integer,
	"reviewed_by" integer,
	"reviewed_at" timestamp,
	"moderation_note" text,
	"content" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "flagged_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"image_url" text NOT NULL,
	"content_type" "flagged_content_type" NOT NULL,
	"content_id" integer NOT NULL,
	"reason" text NOT NULL,
	"status" "flagged_content_status" DEFAULT 'pending' NOT NULL,
	"reported_by" integer,
	"reviewed_by" integer,
	"reviewed_at" timestamp,
	"moderation_note" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"id" serial PRIMARY KEY NOT NULL,
	"follower_id" integer NOT NULL,
	"following_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "follows_follower_id_following_id_unique" UNIQUE("follower_id","following_id")
);
--> statement-breakpoint
CREATE TABLE "fraud_risk_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" varchar(50) NOT NULL,
	"user_id" varchar(50),
	"ip_address" varchar(45) NOT NULL,
	"user_agent" text NOT NULL,
	"risk_score" integer NOT NULL,
	"risk_level" "risk_level" NOT NULL,
	"request_path" text NOT NULL,
	"request_method" varchar(10) NOT NULL,
	"anonymous_fingerprint" text,
	"assessment_data" json NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "fraud_risk_assessments_request_id_unique" UNIQUE("request_id")
);
--> statement-breakpoint
CREATE TABLE "friend_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" integer NOT NULL,
	"recipient_id" integer NOT NULL,
	"message" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "friend_requests_sender_id_recipient_id_unique" UNIQUE("sender_id","recipient_id")
);
--> statement-breakpoint
CREATE TABLE "friendships" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"friend_id" integer NOT NULL,
	"status" varchar(20) DEFAULT 'accepted' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "friendships_user_id_friend_id_unique" UNIQUE("user_id","friend_id")
);
--> statement-breakpoint
CREATE TABLE "gift_card_redemptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"gift_card_id" integer NOT NULL,
	"order_id" integer NOT NULL,
	"redeemed_amount" double precision NOT NULL,
	"remaining_balance" double precision NOT NULL,
	"redeemed_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gift_card_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"gift_card_id" integer NOT NULL,
	"type" "gift_card_transaction_type" NOT NULL,
	"amount" double precision NOT NULL,
	"currency" text DEFAULT 'GBP' NOT NULL,
	"user_id" integer,
	"order_id" integer,
	"stripe_payment_intent_id" text,
	"description" text,
	"metadata" json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gift_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"card_number" text NOT NULL,
	"pin" text NOT NULL,
	"amount" double precision NOT NULL,
	"currency" text DEFAULT 'GBP' NOT NULL,
	"design" "gift_card_design" NOT NULL,
	"status" "gift_card_status" DEFAULT 'active' NOT NULL,
	"purchased_by" integer,
	"purchase_order_id" integer,
	"redeemed_by" integer,
	"redeemed_at" timestamp,
	"redeemed_amount" double precision DEFAULT 0,
	"recipient_email" text,
	"recipient_name" text,
	"gift_message" text,
	"expires_at" timestamp,
	"stripe_payment_intent_id" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "gift_cards_code_unique" UNIQUE("code"),
	CONSTRAINT "gift_cards_card_number_unique" UNIQUE("card_number")
);
--> statement-breakpoint
CREATE TABLE "gift_propositions" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" integer NOT NULL,
	"recipient_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"message" text,
	"status" "gift_status" DEFAULT 'pending' NOT NULL,
	"amount" double precision NOT NULL,
	"currency" text DEFAULT 'GBP' NOT NULL,
	"payment_intent_id" text,
	"responded_at" timestamp,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "government_services" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"service_type" text NOT NULL,
	"service_name" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"request_data" json,
	"document_type" text,
	"appointment_date" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"rejected_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "identity_verifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"verification_type" varchar(20) NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verification_data" json,
	"verified_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "identity_verifications_user_id_verification_type_unique" UNIQUE("user_id","verification_type")
);
--> statement-breakpoint
CREATE TABLE "lifestyle_services" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"location" text,
	"city" text,
	"country" text,
	"address" text,
	"latitude" text,
	"longitude" text,
	"price" text,
	"currency" text DEFAULT 'USD',
	"price_type" text,
	"images" text[],
	"contact_name" text,
	"contact_phone" text,
	"contact_email" text,
	"website" text,
	"operating_hours" text,
	"amenities" text[],
	"rating" text,
	"review_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"is_featured" boolean DEFAULT false,
	"is_verified" boolean DEFAULT false,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "liked_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"event_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "liked_events_user_id_event_id_unique" UNIQUE("user_id","event_id")
);
--> statement-breakpoint
CREATE TABLE "liked_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "liked_products_user_id_product_id_unique" UNIQUE("user_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "market_trends" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer NOT NULL,
	"category" text NOT NULL,
	"period" "analytics_period" NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"trend_direction" text NOT NULL,
	"growth_rate" double precision DEFAULT 0,
	"market_demand" double precision DEFAULT 0,
	"seasonality_factor" double precision DEFAULT 1,
	"competitor_count" integer DEFAULT 0,
	"average_price" double precision DEFAULT 0,
	"price_volatility" double precision DEFAULT 0,
	"search_volume" integer DEFAULT 0,
	"recommended_actions" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" "campaign_type" NOT NULL,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"budget_amount" numeric(10, 2),
	"budget_type" "budget_type",
	"target_audience" text,
	"primary_goal" varchar(100),
	"secondary_goals" json,
	"age_range_min" integer,
	"age_range_max" integer,
	"gender_target" varchar(20),
	"location_targets" json,
	"interest_targets" json,
	"behavior_targets" json,
	"start_date" timestamp,
	"end_date" timestamp,
	"impressions" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"revenue" numeric(10, 2) DEFAULT '0',
	"cost" numeric(10, 2) DEFAULT '0',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "moderation_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_type" text NOT NULL,
	"reporter_id" integer NOT NULL,
	"subject_id" integer NOT NULL,
	"subject_type" text NOT NULL,
	"reason" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by_id" integer,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notification_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" "notification_type" NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "notification_settings_user_id_type_channel_unique" UNIQUE("user_id","type","channel")
);
--> statement-breakpoint
CREATE TABLE "private_room_invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"chatroom_id" integer NOT NULL,
	"invited_by" integer NOT NULL,
	"invited_user" integer NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"invited_at" timestamp DEFAULT now(),
	"responded_at" timestamp,
	CONSTRAINT "private_room_invitations_chatroom_id_invited_user_unique" UNIQUE("chatroom_id","invited_user")
);
--> statement-breakpoint
CREATE TABLE "product_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"period" "analytics_period" NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"views" integer DEFAULT 0,
	"unique_views" integer DEFAULT 0,
	"cart_adds" integer DEFAULT 0,
	"purchases" integer DEFAULT 0,
	"revenue" double precision DEFAULT 0,
	"conversion_rate" double precision DEFAULT 0,
	"average_time_on_page" integer DEFAULT 0,
	"bounce_rate" double precision DEFAULT 0,
	"inventory_sold" integer DEFAULT 0,
	"inventory_remaining" integer DEFAULT 0,
	"average_rating" double precision DEFAULT 0,
	"review_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_forecasts" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"forecast_period" "analytics_period" NOT NULL,
	"forecast_date" date NOT NULL,
	"predicted_sales" integer DEFAULT 0,
	"predicted_revenue" double precision DEFAULT 0,
	"confidence_level" double precision DEFAULT 0,
	"seasonal_adjustment" double precision DEFAULT 1,
	"trend_adjustment" double precision DEFAULT 1,
	"historical_accuracy" double precision DEFAULT 0,
	"recommended_inventory" integer DEFAULT 0,
	"recommended_price" double precision DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_similarity" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id_1" integer NOT NULL,
	"product_id_2" integer NOT NULL,
	"category_similarity" double precision DEFAULT 0,
	"price_similarity" double precision DEFAULT 0,
	"brand_similarity" double precision DEFAULT 0,
	"overall_similarity" double precision NOT NULL,
	"computed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_product_pair" UNIQUE("product_id_1","product_id_2")
);
--> statement-breakpoint
CREATE TABLE "product_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"vendor_id" integer NOT NULL,
	"user_id" integer,
	"session_id" text,
	"device_type" "device_type" NOT NULL,
	"traffic_source" "traffic_source" NOT NULL,
	"country" text,
	"region" text,
	"city" text,
	"user_agent" text,
	"ip_address" text,
	"duration" integer DEFAULT 0,
	"bounce_rate" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotional_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"banner_image_url" text,
	"is_active" boolean DEFAULT true,
	"priority" integer DEFAULT 0,
	"discount_ids" json DEFAULT '[]'::json,
	"show_on_storefront" boolean DEFAULT true,
	"show_in_emails" boolean DEFAULT false,
	"starts_at" timestamp,
	"ends_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "proxy_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_user_id" integer NOT NULL,
	"account_type" "proxy_account_type" NOT NULL,
	"status" "proxy_account_status" DEFAULT 'pending' NOT NULL,
	"account_name" text NOT NULL,
	"email" text,
	"phone_number" text,
	"date_of_birth" date,
	"nationality" text,
	"guardian_full_name" text,
	"guardian_relationship" text,
	"guardian_id_number" text,
	"guardian_email" text,
	"guardian_phone" text,
	"child_age" integer,
	"legal_entity_name" text,
	"business_registration_number" text,
	"tax_id_number" text,
	"vat_number" text,
	"incorporation_date" date,
	"business_type" text,
	"industry_type" text,
	"number_of_employees" integer,
	"annual_revenue" text,
	"registered_address" text,
	"registered_city" text,
	"registered_state" text,
	"registered_country" text,
	"registered_postal_code" text,
	"operating_address" text,
	"operating_city" text,
	"operating_state" text,
	"operating_country" text,
	"operating_postal_code" text,
	"directors" json,
	"beneficial_owners" json,
	"authorized_signatories" json,
	"kyc_status" "kyc_verification_status" DEFAULT 'not_started' NOT NULL,
	"kyc_verified_at" timestamp,
	"kyc_verified_by" integer,
	"identity_verified" boolean DEFAULT false,
	"address_verified" boolean DEFAULT false,
	"source_of_funds" text,
	"purpose_of_account" text,
	"expected_transaction_volume" text,
	"is_politically_exposed" boolean DEFAULT false,
	"political_exposure_details" text,
	"risk_level" "risk_level" DEFAULT 'low',
	"risk_assessment_date" timestamp,
	"risk_assessment_notes" text,
	"documents_uploaded" json,
	"bank_name" text,
	"bank_account_number" text,
	"bank_swift_code" text,
	"bank_iban" text,
	"is_active" boolean DEFAULT true,
	"suspension_reason" text,
	"suspended_at" timestamp,
	"verification_notes" text,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"verified_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "recommendation_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"recommendations" json NOT NULL,
	"algorithm" varchar(50) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "recommendation_experiments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"experiment_name" varchar(100) NOT NULL,
	"algorithm_variant" varchar(50) NOT NULL,
	"click_through_rate" double precision DEFAULT 0,
	"conversion_rate" double precision DEFAULT 0,
	"engagement_score" double precision DEFAULT 0,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "regional_shipping" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"region" "region" NOT NULL,
	"shipping_price" double precision NOT NULL,
	"is_enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "regional_shipping_product_id_region_unique" UNIQUE("product_id","region")
);
--> statement-breakpoint
CREATE TABLE "returns" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_item_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"vendor_id" integer NOT NULL,
	"reason" "return_reason" NOT NULL,
	"description" text,
	"status" "return_status" DEFAULT 'requested' NOT NULL,
	"requested_quantity" integer NOT NULL,
	"approved_quantity" integer DEFAULT 0,
	"refund_amount" double precision DEFAULT 0,
	"return_shipping_cost" double precision DEFAULT 0,
	"vendor_notes" text,
	"customer_notes" text,
	"return_shipping_address" text,
	"return_tracking_number" varchar(100),
	"images" text[] DEFAULT '{}',
	"processed_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "saved_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"post_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "saved_posts_user_id_post_id_unique" UNIQUE("user_id","post_id")
);
--> statement-breakpoint
CREATE TABLE "search_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer NOT NULL,
	"search_query" text NOT NULL,
	"user_id" integer,
	"session_id" text,
	"results_found" integer DEFAULT 0,
	"clicked_product_id" integer,
	"click_position" integer,
	"device_type" "device_type" NOT NULL,
	"converted" boolean DEFAULT false,
	"conversion_value" double precision DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"location" text,
	"city" text,
	"country" text,
	"address" text,
	"latitude" text,
	"longitude" text,
	"price" text,
	"currency" text DEFAULT 'USD',
	"price_type" text,
	"images" text[],
	"contact_name" text,
	"contact_phone" text,
	"contact_email" text,
	"website" text,
	"operating_hours" text,
	"skills" text[],
	"certifications" text[],
	"rating" text,
	"review_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"is_featured" boolean DEFAULT false,
	"is_verified" boolean DEFAULT false,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer NOT NULL,
	"session_id" text NOT NULL,
	"user_id" integer,
	"device_type" "device_type" NOT NULL,
	"traffic_source" "traffic_source" NOT NULL,
	"country" text,
	"age_group" text,
	"gender" "gender",
	"page_views" integer DEFAULT 1,
	"session_duration" integer DEFAULT 0,
	"bounced" boolean DEFAULT false,
	"converted" boolean DEFAULT false,
	"conversion_value" double precision DEFAULT 0,
	"products_viewed" json,
	"cart_value" double precision DEFAULT 0,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "store_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" "store_user_role" NOT NULL,
	"assigned_by" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_user_store" UNIQUE("vendor_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "suspicious_devices" (
	"id" serial PRIMARY KEY NOT NULL,
	"fingerprint" text NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"device_info" json,
	"risk_level" "risk_level" NOT NULL,
	"reason" text NOT NULL,
	"first_detected_at" timestamp DEFAULT now(),
	"last_detected_at" timestamp DEFAULT now(),
	"associated_user_ids" integer[],
	"is_blocked" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "suspicious_devices_fingerprint_unique" UNIQUE("fingerprint")
);
--> statement-breakpoint
CREATE TABLE "traffic_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"source" varchar(50) NOT NULL,
	"campaign" varchar(100),
	"medium" varchar(50),
	"referrer" text,
	"landing_page" text,
	"exit_page" text,
	"device_type" varchar(20),
	"sessions" integer DEFAULT 0 NOT NULL,
	"users" integer DEFAULT 0 NOT NULL,
	"pageviews" integer DEFAULT 0 NOT NULL,
	"bounce_rate" double precision DEFAULT 0,
	"avg_session_duration" double precision DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"revenue" double precision DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "trusted_devices" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"device_name" varchar(100),
	"fingerprint" text NOT NULL,
	"user_agent" text,
	"last_ip" varchar(45),
	"last_used_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "trusted_devices_user_id_fingerprint_unique" UNIQUE("user_id","fingerprint")
);
--> statement-breakpoint
CREATE TABLE "user_blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"blocker_id" integer NOT NULL,
	"blocked_id" integer NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_blocks_blocker_id_blocked_id_unique" UNIQUE("blocker_id","blocked_id")
);
--> statement-breakpoint
CREATE TABLE "user_interactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"interaction_type" "interaction_type" NOT NULL,
	"metadata" json,
	"session_id" varchar(255),
	"user_agent" text,
	"referrer" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"preferred_categories" json DEFAULT '[]'::json,
	"price_range_min" numeric(10, 2) DEFAULT '0',
	"price_range_max" numeric(10, 2) DEFAULT '1000',
	"preferred_brands" json DEFAULT '[]'::json,
	"preferred_time_of_day" varchar(20),
	"shopping_frequency" varchar(20),
	"novelty_seeker" double precision DEFAULT 0.5,
	"brand_loyal" double precision DEFAULT 0.5,
	"price_consciousness" double precision DEFAULT 0.5,
	"quality_focused" double precision DEFAULT 0.5,
	"seasonal_patterns" json DEFAULT '{}'::json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "unique_user_preferences" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"session_id" text NOT NULL,
	"user_agent" text,
	"ip_address" varchar(45),
	"device_type" varchar(20),
	"browser" varchar(50),
	"operating_system" varchar(50),
	"last_active_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_similarity" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id_1" integer NOT NULL,
	"user_id_2" integer NOT NULL,
	"behavioral_similarity" double precision DEFAULT 0,
	"preference_similarity" double precision DEFAULT 0,
	"overall_similarity" double precision NOT NULL,
	"confidence" double precision DEFAULT 0.5,
	"computed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_user_pair" UNIQUE("user_id_1","user_id_2")
);
--> statement-breakpoint
CREATE TABLE "vendor_account_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer NOT NULL,
	"action_type" varchar(50) NOT NULL,
	"reason" text NOT NULL,
	"description" text,
	"commission_period_id" integer,
	"performed_by" varchar(20) DEFAULT 'system' NOT NULL,
	"reversible" boolean DEFAULT true NOT NULL,
	"reversed_at" timestamp,
	"reversed_by" varchar(20),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vendor_affiliate_partners" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer NOT NULL,
	"affiliate_partner_id" integer NOT NULL,
	"assigned_by" integer NOT NULL,
	"assigned_at" timestamp DEFAULT now(),
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"notes" text,
	CONSTRAINT "vendor_affiliate_partners_vendor_id_affiliate_partner_id_unique" UNIQUE("vendor_id","affiliate_partner_id")
);
--> statement-breakpoint
CREATE TABLE "vendor_commission_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"commission_period_id" integer NOT NULL,
	"vendor_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'GBP' NOT NULL,
	"payment_method" text NOT NULL,
	"stripe_payment_intent_id" text,
	"bank_transfer_reference" text,
	"mobile_money_reference" text,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"failure_reason" text,
	"attempt_count" integer DEFAULT 1 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"initiated_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"failed_at" timestamp,
	"next_retry_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vendor_commission_periods" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"total_sales" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_transactions" integer DEFAULT 0 NOT NULL,
	"commission_tier" "commission_tier" DEFAULT 'standard' NOT NULL,
	"commission_rate" numeric(5, 4) DEFAULT '0.15' NOT NULL,
	"commission_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"status" "commission_status" DEFAULT 'pending' NOT NULL,
	"due_date" timestamp NOT NULL,
	"paid_date" timestamp,
	"payment_method" text,
	"payment_reference" text,
	"first_notification_sent" timestamp,
	"second_notification_sent" timestamp,
	"final_warning_notification_sent" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "vendor_commission_periods_vendor_id_year_month_unique" UNIQUE("vendor_id","year","month")
);
--> statement-breakpoint
CREATE TABLE "vendor_discounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"code" text,
	"discount_type" "discount_type" NOT NULL,
	"discount_value" double precision NOT NULL,
	"max_discount_amount" double precision,
	"application" "discount_application" DEFAULT 'code_required' NOT NULL,
	"minimum_order_value" double precision DEFAULT 0,
	"usage_limit" integer,
	"usage_count" integer DEFAULT 0,
	"usage_limit_per_customer" integer,
	"target" "promotion_target" DEFAULT 'all_products' NOT NULL,
	"target_product_ids" json DEFAULT '[]'::json,
	"target_categories" json DEFAULT '[]'::json,
	"buy_quantity" integer,
	"get_quantity" integer,
	"get_discount_percent" double precision,
	"status" "discount_status" DEFAULT 'active' NOT NULL,
	"starts_at" timestamp,
	"ends_at" timestamp,
	"is_public" boolean DEFAULT true,
	"priority" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_vendor_discount_code" UNIQUE("vendor_id","code")
);
--> statement-breakpoint
CREATE TABLE "vendor_payment_info" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer NOT NULL,
	"bank_name" text,
	"account_number" text,
	"routing_number" text,
	"account_holder_name" text,
	"account_type" "account_type",
	"mobile_money_provider" text,
	"mobile_money_number" text,
	"paypal_email" text,
	"tax_id" text,
	"business_type" "business_type",
	"preferred_payment_method" "payment_method" NOT NULL,
	"payment_schedule" "payment_schedule" DEFAULT 'weekly' NOT NULL,
	"minimum_payout_amount" double precision DEFAULT 10 NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "vendor_payment_info_vendor_id_unique" UNIQUE("vendor_id")
);
--> statement-breakpoint
CREATE TABLE "vendor_payment_methods" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer NOT NULL,
	"payment_type" varchar(50) NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"bank_name" text,
	"account_number" text,
	"account_holder_name" text,
	"sort_code" text,
	"iban" text,
	"swift_code" text,
	"mobile_money_provider" text,
	"mobile_money_number" text,
	"mobile_money_name" text,
	"paypal_email" text,
	"stripe_account_id" text,
	"minimum_payout_amount" numeric(10, 2) DEFAULT '10.00',
	"payment_schedule" varchar(20) DEFAULT 'monthly',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "type" SET DATA TYPE notification_type;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "communities" ADD COLUMN "creator_id" integer;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "message_type" text DEFAULT 'text';--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "category" "message_category" DEFAULT 'marketplace';--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "read" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "actor_id" integer;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "event_id" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "currency" text DEFAULT 'GBP' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "subcategory" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "condition" text DEFAULT 'new';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "image" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "thumbnail" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "images" text[];--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "stock_quantity" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "stock" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "quantity" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "product_type" "product_type" DEFAULT 'product' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "status" "product_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "published_on_online_store" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "published_on_point_of_sale" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "published_on_shop" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "vendor" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "collections" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "tags" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "weight" double precision;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "weight_unit" text DEFAULT 'kg';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "dimensions" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "dimension_unit" text DEFAULT 'cm';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sku" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "barcode" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "track_quantity" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "continue_selling_when_out_of_stock" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "requires_shipping" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "shipping_carrier" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "shipping_price" double precision;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "variable_shipping_price" double precision;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "shipping_included" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "vat_included" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "vat_rate" double precision;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "marketplace" "marketplace_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "seo_title" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "seo_description" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "product_code" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "affiliate_partner" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "surname" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_username_change" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "username_change_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verification_token_expires" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_change_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_change_token_expires" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pending_email" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "two_factor_code" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "two_factor_code_expires" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "two_factor_method" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "dating_subscription" "dating_subscription" DEFAULT 'normal';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "dating_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "region" "region";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "country" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "date_of_birth" date;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "gender" "gender";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "shipping_first_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "shipping_last_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "shipping_phone" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "shipping_address" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "shipping_house_number" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "shipping_city" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "shipping_state" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "shipping_zip_code" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "shipping_country" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "shipping_special_instructions" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "shipping_extra_guidelines" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "billing_first_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "billing_last_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "billing_phone" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "billing_address" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "billing_house_number" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "billing_city" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "billing_state" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "billing_zip_code" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "billing_country" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "billing_special_instructions" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "billing_extra_guidelines" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "use_shipping_as_billing" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "preferred_language" text DEFAULT 'EN';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_on_new_notification" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_on_new_message" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_on_new_order" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ai_training_consent" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "account_suspended" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "account_suspended_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "account_deleted" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "account_deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "original_username" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "current_position" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "industry" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "education" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "salary_range" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "id_document_type" "kyc_document_type";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "id_document_number" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "id_document_expiry_date" date;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "id_document_issue_country" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "occupation" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "source_of_funds" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_politically_exposed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "political_exposure_details" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "proof_of_address_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "kyc_status" "kyc_status" DEFAULT 'not_submitted';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "kyc_verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "aml_risk_level" "risk_level" DEFAULT 'low';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "aml_checked_at" timestamp;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "vendor_type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "business_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "business_type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "phone" text NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "contact_email" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "contact_phone" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "address" text NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "city" text NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "state" text NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "zip_code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "country" text NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "tax_id" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "badge_level" "vendor_badge_level" DEFAULT 'new_vendor';--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "total_sales_amount" double precision DEFAULT 0;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "total_sales" double precision DEFAULT 0;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "total_transactions" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "verification_status" text DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "last_badge_update" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "is_approved" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "is_active" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "account_status" "vendor_account_status" DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "account_suspended_at" timestamp;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "account_suspension_reason" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "payment_issue_notified_at" timestamp;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "payment_failure_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "has_sales_manager" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "sales_manager_name" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "sales_manager_id" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "unit_system" text DEFAULT 'metric';--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "weight_system" text DEFAULT 'kg';--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "timezone" text DEFAULT 'Europe/London';--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "billing_cycle" text DEFAULT 'monthly';--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "currency" varchar(3) DEFAULT 'GBP';--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "monetization_type" "video_monetization" DEFAULT 'free';--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "stripe_product_id" varchar(100);--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "stripe_price_id" varchar(100);--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "storage_key" varchar(255);--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "preview_url" text;--> statement-breakpoint
ALTER TABLE "advertisement_clicks" ADD CONSTRAINT "advertisement_clicks_advertisement_id_advertisements_id_fk" FOREIGN KEY ("advertisement_id") REFERENCES "public"."advertisements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advertisement_clicks" ADD CONSTRAINT "advertisement_clicks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advertisement_impressions" ADD CONSTRAINT "advertisement_impressions_advertisement_id_advertisements_id_fk" FOREIGN KEY ("advertisement_id") REFERENCES "public"."advertisements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advertisement_impressions" ADD CONSTRAINT "advertisement_impressions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advertisements" ADD CONSTRAINT "advertisements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allow_list" ADD CONSTRAINT "allow_list_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audio_session_participants" ADD CONSTRAINT "audio_session_participants_session_id_audio_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."audio_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audio_session_participants" ADD CONSTRAINT "audio_session_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audio_sessions" ADD CONSTRAINT "audio_sessions_chatroom_id_chatrooms_id_fk" FOREIGN KEY ("chatroom_id") REFERENCES "public"."chatrooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audio_sessions" ADD CONSTRAINT "audio_sessions_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block_list" ADD CONSTRAINT "block_list_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_event_participants" ADD CONSTRAINT "calendar_event_participants_event_id_calendar_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."calendar_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_event_participants" ADD CONSTRAINT "calendar_event_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_event_reminders" ADD CONSTRAINT "calendar_event_reminders_event_id_calendar_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."calendar_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_event_reminders" ADD CONSTRAINT "calendar_event_reminders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_metadata" ADD CONSTRAINT "call_metadata_call_session_id_call_sessions_id_fk" FOREIGN KEY ("call_session_id") REFERENCES "public"."call_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_sessions" ADD CONSTRAINT "call_sessions_initiator_id_users_id_fk" FOREIGN KEY ("initiator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_sessions" ADD CONSTRAINT "call_sessions_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_activities" ADD CONSTRAINT "campaign_activities_campaign_id_marketing_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."marketing_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_analytics" ADD CONSTRAINT "campaign_analytics_campaign_id_marketing_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."marketing_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_products" ADD CONSTRAINT "campaign_products_campaign_id_marketing_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."marketing_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_products" ADD CONSTRAINT "campaign_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_touchpoints" ADD CONSTRAINT "campaign_touchpoints_campaign_id_marketing_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."marketing_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_touchpoints" ADD CONSTRAINT "campaign_touchpoints_activity_id_campaign_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."campaign_activities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_touchpoints" ADD CONSTRAINT "campaign_touchpoints_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_touchpoints" ADD CONSTRAINT "campaign_touchpoints_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatroom_members" ADD CONSTRAINT "chatroom_members_chatroom_id_chatrooms_id_fk" FOREIGN KEY ("chatroom_id") REFERENCES "public"."chatrooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatroom_members" ADD CONSTRAINT "chatroom_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatroom_messages" ADD CONSTRAINT "chatroom_messages_chatroom_id_chatrooms_id_fk" FOREIGN KEY ("chatroom_id") REFERENCES "public"."chatrooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatroom_messages" ADD CONSTRAINT "chatroom_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatrooms" ADD CONSTRAINT "chatrooms_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_event_attendees" ADD CONSTRAINT "community_event_attendees_event_id_community_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."community_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_event_attendees" ADD CONSTRAINT "community_event_attendees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_events" ADD CONSTRAINT "community_events_organizer_id_users_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitor_analytics" ADD CONSTRAINT "competitor_analytics_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitor_analytics" ADD CONSTRAINT "competitor_analytics_competitor_vendor_id_vendors_id_fk" FOREIGN KEY ("competitor_vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversion_events" ADD CONSTRAINT "conversion_events_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversion_events" ADD CONSTRAINT "conversion_events_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversion_events" ADD CONSTRAINT "conversion_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crypto_payments" ADD CONSTRAINT "crypto_payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crypto_payments" ADD CONSTRAINT "crypto_payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dating_likes" ADD CONSTRAINT "dating_likes_liker_id_users_id_fk" FOREIGN KEY ("liker_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dating_likes" ADD CONSTRAINT "dating_likes_liked_id_users_id_fk" FOREIGN KEY ("liked_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dating_matches" ADD CONSTRAINT "dating_matches_user1_id_users_id_fk" FOREIGN KEY ("user1_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dating_matches" ADD CONSTRAINT "dating_matches_user2_id_users_id_fk" FOREIGN KEY ("user2_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dating_profiles" ADD CONSTRAINT "dating_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demographic_analytics" ADD CONSTRAINT "demographic_analytics_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_usages" ADD CONSTRAINT "discount_usages_discount_id_vendor_discounts_id_fk" FOREIGN KEY ("discount_id") REFERENCES "public"."vendor_discounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_usages" ADD CONSTRAINT "discount_usages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_usages" ADD CONSTRAINT "discount_usages_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_analytics" ADD CONSTRAINT "financial_analytics_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_services" ADD CONSTRAINT "financial_services_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flagged_content" ADD CONSTRAINT "flagged_content_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flagged_content" ADD CONSTRAINT "flagged_content_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flagged_images" ADD CONSTRAINT "flagged_images_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flagged_images" ADD CONSTRAINT "flagged_images_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_id_users_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend_requests" ADD CONSTRAINT "friend_requests_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend_requests" ADD CONSTRAINT "friend_requests_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_friend_id_users_id_fk" FOREIGN KEY ("friend_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_card_redemptions" ADD CONSTRAINT "gift_card_redemptions_gift_card_id_gift_cards_id_fk" FOREIGN KEY ("gift_card_id") REFERENCES "public"."gift_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_card_redemptions" ADD CONSTRAINT "gift_card_redemptions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_card_redemptions" ADD CONSTRAINT "gift_card_redemptions_redeemed_by_users_id_fk" FOREIGN KEY ("redeemed_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_card_transactions" ADD CONSTRAINT "gift_card_transactions_gift_card_id_gift_cards_id_fk" FOREIGN KEY ("gift_card_id") REFERENCES "public"."gift_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_card_transactions" ADD CONSTRAINT "gift_card_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_card_transactions" ADD CONSTRAINT "gift_card_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_cards" ADD CONSTRAINT "gift_cards_purchased_by_users_id_fk" FOREIGN KEY ("purchased_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_cards" ADD CONSTRAINT "gift_cards_purchase_order_id_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_cards" ADD CONSTRAINT "gift_cards_redeemed_by_users_id_fk" FOREIGN KEY ("redeemed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_propositions" ADD CONSTRAINT "gift_propositions_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_propositions" ADD CONSTRAINT "gift_propositions_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_propositions" ADD CONSTRAINT "gift_propositions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "government_services" ADD CONSTRAINT "government_services_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity_verifications" ADD CONSTRAINT "identity_verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lifestyle_services" ADD CONSTRAINT "lifestyle_services_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liked_events" ADD CONSTRAINT "liked_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liked_events" ADD CONSTRAINT "liked_events_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liked_products" ADD CONSTRAINT "liked_products_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liked_products" ADD CONSTRAINT "liked_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_trends" ADD CONSTRAINT "market_trends_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_campaigns" ADD CONSTRAINT "marketing_campaigns_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_reports" ADD CONSTRAINT "moderation_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_reports" ADD CONSTRAINT "moderation_reports_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private_room_invitations" ADD CONSTRAINT "private_room_invitations_chatroom_id_chatrooms_id_fk" FOREIGN KEY ("chatroom_id") REFERENCES "public"."chatrooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private_room_invitations" ADD CONSTRAINT "private_room_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private_room_invitations" ADD CONSTRAINT "private_room_invitations_invited_user_users_id_fk" FOREIGN KEY ("invited_user") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_analytics" ADD CONSTRAINT "product_analytics_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_analytics" ADD CONSTRAINT "product_analytics_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_forecasts" ADD CONSTRAINT "product_forecasts_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_forecasts" ADD CONSTRAINT "product_forecasts_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_similarity" ADD CONSTRAINT "product_similarity_product_id_1_products_id_fk" FOREIGN KEY ("product_id_1") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_similarity" ADD CONSTRAINT "product_similarity_product_id_2_products_id_fk" FOREIGN KEY ("product_id_2") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_views" ADD CONSTRAINT "product_views_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_views" ADD CONSTRAINT "product_views_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_views" ADD CONSTRAINT "product_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotional_campaigns" ADD CONSTRAINT "promotional_campaigns_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proxy_accounts" ADD CONSTRAINT "proxy_accounts_parent_user_id_users_id_fk" FOREIGN KEY ("parent_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proxy_accounts" ADD CONSTRAINT "proxy_accounts_kyc_verified_by_users_id_fk" FOREIGN KEY ("kyc_verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_cache" ADD CONSTRAINT "recommendation_cache_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_experiments" ADD CONSTRAINT "recommendation_experiments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regional_shipping" ADD CONSTRAINT "regional_shipping_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_posts" ADD CONSTRAINT "saved_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_posts" ADD CONSTRAINT "saved_posts_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_analytics" ADD CONSTRAINT "search_analytics_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_analytics" ADD CONSTRAINT "search_analytics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_analytics" ADD CONSTRAINT "search_analytics_clicked_product_id_products_id_fk" FOREIGN KEY ("clicked_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_analytics" ADD CONSTRAINT "session_analytics_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_analytics" ADD CONSTRAINT "session_analytics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_users" ADD CONSTRAINT "store_users_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_users" ADD CONSTRAINT "store_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_users" ADD CONSTRAINT "store_users_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trusted_devices" ADD CONSTRAINT "trusted_devices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocker_id_users_id_fk" FOREIGN KEY ("blocker_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocked_id_users_id_fk" FOREIGN KEY ("blocked_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_interactions" ADD CONSTRAINT "user_interactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_interactions" ADD CONSTRAINT "user_interactions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_similarity" ADD CONSTRAINT "user_similarity_user_id_1_users_id_fk" FOREIGN KEY ("user_id_1") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_similarity" ADD CONSTRAINT "user_similarity_user_id_2_users_id_fk" FOREIGN KEY ("user_id_2") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_account_actions" ADD CONSTRAINT "vendor_account_actions_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_account_actions" ADD CONSTRAINT "vendor_account_actions_commission_period_id_vendor_commission_periods_id_fk" FOREIGN KEY ("commission_period_id") REFERENCES "public"."vendor_commission_periods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_affiliate_partners" ADD CONSTRAINT "vendor_affiliate_partners_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_affiliate_partners" ADD CONSTRAINT "vendor_affiliate_partners_affiliate_partner_id_affiliate_partners_id_fk" FOREIGN KEY ("affiliate_partner_id") REFERENCES "public"."affiliate_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_affiliate_partners" ADD CONSTRAINT "vendor_affiliate_partners_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_commission_payments" ADD CONSTRAINT "vendor_commission_payments_commission_period_id_vendor_commission_periods_id_fk" FOREIGN KEY ("commission_period_id") REFERENCES "public"."vendor_commission_periods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_commission_payments" ADD CONSTRAINT "vendor_commission_payments_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_commission_periods" ADD CONSTRAINT "vendor_commission_periods_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_discounts" ADD CONSTRAINT "vendor_discounts_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_payment_info" ADD CONSTRAINT "vendor_payment_info_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_payment_methods" ADD CONSTRAINT "vendor_payment_methods_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_affiliate_partner_code" ON "affiliate_partners" USING btree ("partner_code");--> statement-breakpoint
CREATE INDEX "idx_affiliate_status" ON "affiliate_partners" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_affiliate_email" ON "affiliate_partners" USING btree ("email");--> statement-breakpoint
CREATE INDEX "auth_tokens_user_id_idx" ON "auth_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_tokens_token_idx" ON "auth_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "calendar_event_participants_event_id_idx" ON "calendar_event_participants" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "calendar_event_participants_user_id_idx" ON "calendar_event_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "calendar_event_reminders_event_id_idx" ON "calendar_event_reminders" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "calendar_event_reminders_user_id_idx" ON "calendar_event_reminders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "calendar_event_reminders_time_idx" ON "calendar_event_reminders" USING btree ("reminder_time");--> statement-breakpoint
CREATE INDEX "calendar_events_user_id_idx" ON "calendar_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "calendar_events_category_idx" ON "calendar_events" USING btree ("category");--> statement-breakpoint
CREATE INDEX "calendar_events_start_date_idx" ON "calendar_events" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "calendar_events_status_idx" ON "calendar_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "calendar_events_related_type_idx" ON "calendar_events" USING btree ("related_type");--> statement-breakpoint
CREATE INDEX "idx_activities_campaign_id" ON "campaign_activities" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_activities_channel" ON "campaign_activities" USING btree ("channel");--> statement-breakpoint
CREATE INDEX "idx_activities_scheduled_date" ON "campaign_activities" USING btree ("scheduled_date");--> statement-breakpoint
CREATE INDEX "idx_activities_published_date" ON "campaign_activities" USING btree ("published_date");--> statement-breakpoint
CREATE INDEX "idx_activities_active" ON "campaign_activities" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_analytics_campaign_date" ON "campaign_analytics" USING btree ("campaign_id","date");--> statement-breakpoint
CREATE INDEX "idx_analytics_campaign_id" ON "campaign_analytics" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_analytics_date" ON "campaign_analytics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_analytics_period" ON "campaign_analytics" USING btree ("period");--> statement-breakpoint
CREATE INDEX "idx_campaign_products_campaign_product" ON "campaign_products" USING btree ("campaign_id","product_id");--> statement-breakpoint
CREATE INDEX "idx_campaign_products_campaign_id" ON "campaign_products" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_campaign_products_product_id" ON "campaign_products" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_campaign_products_featured" ON "campaign_products" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "idx_touchpoints_campaign_id" ON "campaign_touchpoints" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_touchpoints_activity_id" ON "campaign_touchpoints" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "idx_touchpoints_user_id" ON "campaign_touchpoints" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_touchpoints_type" ON "campaign_touchpoints" USING btree ("touchpoint_type");--> statement-breakpoint
CREATE INDEX "idx_touchpoints_channel" ON "campaign_touchpoints" USING btree ("channel");--> statement-breakpoint
CREATE INDEX "idx_touchpoints_created_at" ON "campaign_touchpoints" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_chatroom_members_chatroom" ON "chatroom_members" USING btree ("chatroom_id");--> statement-breakpoint
CREATE INDEX "idx_chatroom_members_user" ON "chatroom_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_chatroom_messages_chatroom" ON "chatroom_messages" USING btree ("chatroom_id");--> statement-breakpoint
CREATE INDEX "idx_chatroom_messages_user" ON "chatroom_messages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_chatroom_messages_created" ON "chatroom_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "country_idx" ON "cities" USING btree ("country");--> statement-breakpoint
CREATE INDEX "region_idx" ON "cities" USING btree ("region");--> statement-breakpoint
CREATE INDEX "name_idx" ON "cities" USING btree ("name");--> statement-breakpoint
CREATE INDEX "population_idx" ON "cities" USING btree ("population");--> statement-breakpoint
CREATE INDEX "dating_likes_liker_idx" ON "dating_likes" USING btree ("liker_id");--> statement-breakpoint
CREATE INDEX "dating_likes_liked_idx" ON "dating_likes" USING btree ("liked_id");--> statement-breakpoint
CREATE INDEX "dating_matches_user1_idx" ON "dating_matches" USING btree ("user1_id");--> statement-breakpoint
CREATE INDEX "dating_matches_user2_idx" ON "dating_matches" USING btree ("user2_id");--> statement-breakpoint
CREATE INDEX "discount_usages_discount_id_idx" ON "discount_usages" USING btree ("discount_id");--> statement-breakpoint
CREATE INDEX "discount_usages_user_id_idx" ON "discount_usages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "discount_usages_order_id_idx" ON "discount_usages" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "financial_services_user_id_idx" ON "financial_services" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "financial_services_service_type_idx" ON "financial_services" USING btree ("service_type");--> statement-breakpoint
CREATE INDEX "financial_services_status_idx" ON "financial_services" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_fraud_ip_address" ON "fraud_risk_assessments" USING btree ("ip_address");--> statement-breakpoint
CREATE INDEX "idx_fraud_user_id" ON "fraud_risk_assessments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_fraud_risk_level" ON "fraud_risk_assessments" USING btree ("risk_level");--> statement-breakpoint
CREATE INDEX "idx_fraud_created_at" ON "fraud_risk_assessments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "friendships_user_id_idx" ON "friendships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "friendships_friend_id_idx" ON "friendships" USING btree ("friend_id");--> statement-breakpoint
CREATE INDEX "gift_card_redemptions_gift_card_id_idx" ON "gift_card_redemptions" USING btree ("gift_card_id");--> statement-breakpoint
CREATE INDEX "gift_card_redemptions_order_id_idx" ON "gift_card_redemptions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "gift_card_redemptions_redeemed_by_idx" ON "gift_card_redemptions" USING btree ("redeemed_by");--> statement-breakpoint
CREATE INDEX "gift_card_transactions_gift_card_id_idx" ON "gift_card_transactions" USING btree ("gift_card_id");--> statement-breakpoint
CREATE INDEX "gift_card_transactions_type_idx" ON "gift_card_transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "gift_card_transactions_user_id_idx" ON "gift_card_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "gift_card_transactions_created_at_idx" ON "gift_card_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "gift_cards_code_idx" ON "gift_cards" USING btree ("code");--> statement-breakpoint
CREATE INDEX "gift_cards_card_number_idx" ON "gift_cards" USING btree ("card_number");--> statement-breakpoint
CREATE INDEX "gift_cards_status_idx" ON "gift_cards" USING btree ("status");--> statement-breakpoint
CREATE INDEX "gift_cards_purchased_by_idx" ON "gift_cards" USING btree ("purchased_by");--> statement-breakpoint
CREATE INDEX "gift_cards_redeemed_by_idx" ON "gift_cards" USING btree ("redeemed_by");--> statement-breakpoint
CREATE INDEX "gift_cards_expires_at_idx" ON "gift_cards" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_gift_propositions_sender" ON "gift_propositions" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "idx_gift_propositions_recipient" ON "gift_propositions" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "idx_gift_propositions_product" ON "gift_propositions" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_gift_propositions_status" ON "gift_propositions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "government_services_user_id_idx" ON "government_services" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "government_services_service_type_idx" ON "government_services" USING btree ("service_type");--> statement-breakpoint
CREATE INDEX "government_services_status_idx" ON "government_services" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_campaigns_vendor_id" ON "marketing_campaigns" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "idx_campaigns_status" ON "marketing_campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_campaigns_type" ON "marketing_campaigns" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_campaigns_start_date" ON "marketing_campaigns" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "idx_campaigns_end_date" ON "marketing_campaigns" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX "idx_campaigns_active" ON "marketing_campaigns" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_similarity_product1" ON "product_similarity" USING btree ("product_id_1");--> statement-breakpoint
CREATE INDEX "idx_similarity_product2" ON "product_similarity" USING btree ("product_id_2");--> statement-breakpoint
CREATE INDEX "idx_similarity_overall" ON "product_similarity" USING btree ("overall_similarity");--> statement-breakpoint
CREATE INDEX "promotional_campaigns_vendor_id_idx" ON "promotional_campaigns" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "promotional_campaigns_active_idx" ON "promotional_campaigns" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "proxy_accounts_parent_user_id_idx" ON "proxy_accounts" USING btree ("parent_user_id");--> statement-breakpoint
CREATE INDEX "proxy_accounts_account_type_idx" ON "proxy_accounts" USING btree ("account_type");--> statement-breakpoint
CREATE INDEX "proxy_accounts_status_idx" ON "proxy_accounts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "proxy_accounts_kyc_status_idx" ON "proxy_accounts" USING btree ("kyc_status");--> statement-breakpoint
CREATE INDEX "idx_recommendation_cache_user" ON "recommendation_cache" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_recommendation_cache_expires" ON "recommendation_cache" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_recommendation_cache_algorithm" ON "recommendation_cache" USING btree ("algorithm");--> statement-breakpoint
CREATE INDEX "idx_experiment_user" ON "recommendation_experiments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_experiment_name" ON "recommendation_experiments" USING btree ("experiment_name");--> statement-breakpoint
CREATE INDEX "idx_experiment_variant" ON "recommendation_experiments" USING btree ("algorithm_variant");--> statement-breakpoint
CREATE INDEX "store_users_vendor_id_idx" ON "store_users" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "store_users_user_id_idx" ON "store_users" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_trusted_device_user_id" ON "trusted_devices" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_blocks_blocker_id_idx" ON "user_blocks" USING btree ("blocker_id");--> statement-breakpoint
CREATE INDEX "user_blocks_blocked_id_idx" ON "user_blocks" USING btree ("blocked_id");--> statement-breakpoint
CREATE INDEX "idx_interactions_user" ON "user_interactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_interactions_product" ON "user_interactions" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_interactions_type" ON "user_interactions" USING btree ("interaction_type");--> statement-breakpoint
CREATE INDEX "idx_interactions_timestamp" ON "user_interactions" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_interactions_user_product" ON "user_interactions" USING btree ("user_id","product_id");--> statement-breakpoint
CREATE INDEX "idx_user_similarity_user1" ON "user_similarity" USING btree ("user_id_1");--> statement-breakpoint
CREATE INDEX "idx_user_similarity_user2" ON "user_similarity" USING btree ("user_id_2");--> statement-breakpoint
CREATE INDEX "idx_user_similarity_overall" ON "user_similarity" USING btree ("overall_similarity");--> statement-breakpoint
CREATE INDEX "idx_account_action_vendor" ON "vendor_account_actions" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "idx_account_action_type" ON "vendor_account_actions" USING btree ("action_type");--> statement-breakpoint
CREATE INDEX "idx_account_action_created" ON "vendor_account_actions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_vendor_affiliate_vendor" ON "vendor_affiliate_partners" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "idx_vendor_affiliate_partner" ON "vendor_affiliate_partners" USING btree ("affiliate_partner_id");--> statement-breakpoint
CREATE INDEX "idx_payment_commission_period" ON "vendor_commission_payments" USING btree ("commission_period_id");--> statement-breakpoint
CREATE INDEX "idx_payment_vendor" ON "vendor_commission_payments" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "idx_payment_status" ON "vendor_commission_payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_payment_next_retry" ON "vendor_commission_payments" USING btree ("next_retry_at");--> statement-breakpoint
CREATE INDEX "idx_commission_vendor_period" ON "vendor_commission_periods" USING btree ("vendor_id","year","month");--> statement-breakpoint
CREATE INDEX "idx_commission_status" ON "vendor_commission_periods" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_commission_due_date" ON "vendor_commission_periods" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "vendor_discounts_vendor_id_idx" ON "vendor_discounts" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "vendor_discounts_code_idx" ON "vendor_discounts" USING btree ("code");--> statement-breakpoint
CREATE INDEX "vendor_discounts_status_idx" ON "vendor_discounts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_vendor_payment_vendor_id" ON "vendor_payment_info" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "idx_payment_method_vendor" ON "vendor_payment_methods" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "idx_payment_method_primary" ON "vendor_payment_methods" USING btree ("vendor_id","is_primary");--> statement-breakpoint
CREATE INDEX "idx_payment_method_type" ON "vendor_payment_methods" USING btree ("payment_type");--> statement-breakpoint
ALTER TABLE "communities" ADD CONSTRAINT "communities_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "plan";--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_product_code_unique" UNIQUE("product_code");--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "unique_user_vendor_type" UNIQUE("user_id","vendor_type");