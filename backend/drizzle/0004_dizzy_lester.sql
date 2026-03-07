CREATE TABLE "zones" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "zones_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "mustahiq" ADD COLUMN "zone_id" integer;--> statement-breakpoint
ALTER TABLE "mustahiq" ADD CONSTRAINT "mustahiq_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE no action ON UPDATE no action;