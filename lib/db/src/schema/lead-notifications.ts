import { pgTable, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { earlyAccessLeads } from "./muntej";

export const leadNotifications = pgTable("lead_notifications", {
  leadId: integer("lead_id").primaryKey().references(() => earlyAccessLeads.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  messageId: text("message_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
});
export const insertLeadNotificationSchema = createInsertSchema(leadNotifications);
export type LeadNotification = typeof leadNotifications.$inferSelect;
