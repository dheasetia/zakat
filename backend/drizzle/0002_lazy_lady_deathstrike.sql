CREATE TYPE "public"."distribution_method" AS ENUM('Cash', 'Transfer', 'Titip');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('Laki-laki', 'Perempuan');--> statement-breakpoint
ALTER TABLE "mustahiq" ADD COLUMN "gender" "gender";--> statement-breakpoint
ALTER TABLE "mustahiq" ADD COLUMN "age" integer;--> statement-breakpoint
ALTER TABLE "mustahiq" ADD COLUMN "priority_level" integer;--> statement-breakpoint
ALTER TABLE "mustahiq" ADD COLUMN "id_card_image_url" text;--> statement-breakpoint
ALTER TABLE "mustahiq" ADD COLUMN "profile_image_url" text;--> statement-breakpoint
ALTER TABLE "zakat_keluar" ADD COLUMN "distribution_method" "distribution_method" DEFAULT 'Cash' NOT NULL;--> statement-breakpoint
ALTER TABLE "zakat_keluar" ADD COLUMN "entrusted_to" varchar(255);