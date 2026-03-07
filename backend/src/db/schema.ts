import { pgTable, serial, text, timestamp, varchar, integer, uuid, decimal, pgEnum, boolean } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["ADMIN", "PEMBAGI", "MUZAKKI"]);
export const asnafEnum = pgEnum("asnaf_category", ["Fakir", "Miskin", "Amil", "Mualaf", "Riqab", "Gharim", "Fisabilillah", "Ibnu Sabil"]);
export const mustahiqStatusEnum = pgEnum("status", ["Menunggu Survei", "Layak", "Tidak Layak"]);
export const genderEnum = pgEnum("gender", ["Laki-laki", "Perempuan"]);
export const distributionMethodEnum = pgEnum("distribution_method", ["Cash", "Transfer", "Titip"]);

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: roleEnum("role").default("MUZAKKI").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const muzakki = pgTable("muzakki", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id), // Nullable, if they have login account
    name: varchar("name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }),
    address: text("address"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const zones = pgTable("zones", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull().unique(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mustahiq = pgTable("mustahiq", {
    id: uuid("id").primaryKey().defaultRandom(),
    zoneId: integer("zone_id").references(() => zones.id), // Nullable for backwards compatibility
    name: varchar("name", { length: 255 }).notNull(),
    nik: varchar("nik", { length: 50 }).notNull().unique(),
    phone: varchar("phone", { length: 50 }),
    address: text("address"),
    gender: genderEnum("gender"),
    age: integer("age"),
    priorityLevel: integer("priority_level"),
    idCardImageUrl: text("id_card_image_url"),
    profileImageUrl: text("profile_image_url"),
    asnafCategory: asnafEnum("asnaf_category").notNull(),
    status: mustahiqStatusEnum("status").default("Menunggu Survei").notNull(),
    inputBy: uuid("input_by").references(() => users.id), // User Admin/Pembagi yang mendata, nullable for backwards compatibility
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const zakatMasuk = pgTable("zakat_masuk", {
    id: uuid("id").primaryKey().defaultRandom(),
    muzakkiId: uuid("muzakki_id").references(() => muzakki.id).notNull(),
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    category: varchar("category", { length: 100 }).notNull(), // Zakat Fitrah, Zakat Mal, Infaq, Sedekah
    date: timestamp("date").defaultNow().notNull(),
    receivedBy: uuid("received_by").references(() => users.id).notNull(), // User Admin
});

export const zakatKeluar = pgTable("zakat_keluar", {
    id: uuid("id").primaryKey().defaultRandom(),
    mustahiqId: uuid("mustahiq_id").references(() => mustahiq.id).notNull(),
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    distributionMethod: distributionMethodEnum("distribution_method").default("Cash").notNull(),
    entrustedTo: varchar("entrusted_to", { length: 255 }),
    proofImageUrl: text("proof_image_url"),
    date: timestamp("date").defaultNow().notNull(),
    distributedBy: uuid("distributed_by").references(() => users.id).notNull(), // User Pembagi
});
