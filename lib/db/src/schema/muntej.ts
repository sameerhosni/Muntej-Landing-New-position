import { pgTable, serial, text, timestamp, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const earlyAccessLeads = pgTable("early_access_leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  company: text("company").notNull(),
  role: text("role").notNull(),
  teamSize: text("team_size").notNull(),
  whatsapp: text("whatsapp").notNull(),
  language: text("language").notNull(),
  utmSource: text("utm_source").notNull().default(""),
  utmMedium: text("utm_medium").notNull().default(""),
  utmCampaign: text("utm_campaign").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("early_access_leads_created_at_idx").on(t.createdAt)]);
export const insertLeadSchema = createInsertSchema(earlyAccessLeads).omit({ id: true, createdAt: true });
export type EarlyAccessLead = typeof earlyAccessLeads.$inferSelect;

export const marketingEvents = pgTable("marketing_events", {
  id: serial("id").primaryKey(),
  event: text("event").notNull(),
  section: text("section").notNull().default(""),
  language: text("language").notNull(),
  utmSource: text("utm_source").notNull().default(""),
  utmMedium: text("utm_medium").notNull().default(""),
  utmCampaign: text("utm_campaign").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const adminSessions = pgTable("admin_sessions", {
  tokenHash: text("token_hash").primaryKey(),
  passwordFingerprint: text("password_fingerprint").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
export const requestLimits = pgTable("request_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(1),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
