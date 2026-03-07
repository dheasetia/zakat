CREATE TYPE "public"."asnaf_category" AS ENUM('Fakir', 'Miskin', 'Amil', 'Mualaf', 'Riqab', 'Gharim', 'Fisabilillah', 'Ibnu Sabil');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('Menunggu Survei', 'Layak', 'Tidak Layak');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('ADMIN', 'PEMBAGI', 'MUZAKKI');--> statement-breakpoint
CREATE TABLE "mustahiq" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"nik" varchar(50) NOT NULL,
	"phone" varchar(50),
	"address" text,
	"asnaf_category" "asnaf_category" NOT NULL,
	"status" "status" DEFAULT 'Menunggu Survei' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mustahiq_nik_unique" UNIQUE("nik")
);
--> statement-breakpoint
CREATE TABLE "muzakki" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" varchar(255) NOT NULL,
	"phone" varchar(50),
	"address" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" "role" DEFAULT 'MUZAKKI' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "zakat_keluar" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mustahiq_id" uuid NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"category" varchar(100) NOT NULL,
	"proof_image_url" text,
	"date" timestamp DEFAULT now() NOT NULL,
	"distributed_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zakat_masuk" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"muzakki_id" uuid NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"category" varchar(100) NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"received_by" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "muzakki" ADD CONSTRAINT "muzakki_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zakat_keluar" ADD CONSTRAINT "zakat_keluar_mustahiq_id_mustahiq_id_fk" FOREIGN KEY ("mustahiq_id") REFERENCES "public"."mustahiq"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zakat_keluar" ADD CONSTRAINT "zakat_keluar_distributed_by_users_id_fk" FOREIGN KEY ("distributed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zakat_masuk" ADD CONSTRAINT "zakat_masuk_muzakki_id_muzakki_id_fk" FOREIGN KEY ("muzakki_id") REFERENCES "public"."muzakki"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zakat_masuk" ADD CONSTRAINT "zakat_masuk_received_by_users_id_fk" FOREIGN KEY ("received_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;