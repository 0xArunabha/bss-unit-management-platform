import { sql } from "drizzle-orm";
import { pgTable, uuid, text, integer, numeric, timestamp, boolean, uniqueIndex, check } from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  role: text("role").notNull().default("member"),
  status: text("status").notNull().default("active"),
  monthlyPledge: numeric("monthly_pledge", { precision: 12, scale: 2, mode: "number" }).notNull().default(20),
  avatarColor: text("avatar_color").notNull().default("peach"),
  unpaidMonths: integer("unpaid_months").notNull().default(0),
  pin: text("pin").notNull().default("1234"),
  googleEmail: text("google_email"),
  needsPinChange: boolean("needs_pin_change").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check("minimum_pledge", sql`${t.monthlyPledge} >= 20`),
  check("profile_role", sql`${t.role} in ('admin', 'organizer', 'volunteer', 'member')`),
  check("profile_status", sql`${t.status} in ('active', 'inactive')`),
]);

export const dues = pgTable("membership_dues", {
  id: uuid("id").primaryKey().defaultRandom(),
  memberId: uuid("member_id").notNull().references(() => profiles.id),
  month: integer("dues_month").notNull(),
  year: integer("dues_year").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2, mode: "number" }).notNull(),
  paymentMode: text("payment_mode").notNull().default("cash"),
  collectedBy: uuid("collected_by").references(() => profiles.id),
  paidAt: timestamp("paid_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("member_month_year").on(t.memberId, t.month, t.year),
  check("minimum_dues", sql`${t.amount} >= 20`),
  check("dues_valid_month", sql`${t.month} between 1 and 12`),
]);

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  category: text("category").notNull(),
  volunteers: integer("volunteers").notNull().default(0),
  image: text("image").notNull().default("/images/science-outreach.jpg"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const procurements = pgTable("event_procurements", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull().references(() => events.id),
  itemName: text("item_name").notNull(),
  quantity: text("quantity").notNull(),
  estimatedCost: numeric("estimated_cost", { precision: 12, scale: 2, mode: "number" }).notNull(),
  actualCost: numeric("actual_cost", { precision: 12, scale: 2, mode: "number" }),
  status: text("status").notNull().default("needed"),
  purchasedBy: uuid("purchased_by").references(() => profiles.id),
  purchasedAt: timestamp("purchased_at", { withTimezone: true }),
  verifiedBy: uuid("verified_by").references(() => profiles.id),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  createdBy: uuid("created_by").references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check("different_verifier", sql`${t.verifiedBy} is null or ${t.verifiedBy} != ${t.purchasedBy}`),
  check("procurement_state", sql`${t.status} in ('needed', 'purchased', 'verified')`),
  check("exact_purchase_required", sql`${t.status} = 'needed' or (${t.actualCost} is not null and ${t.purchasedBy} is not null)`),
  check("verification_required", sql`${t.status} != 'verified' or ${t.verifiedBy} is not null`),
  check("nonnegative_spend", sql`${t.actualCost} is null or ${t.actualCost} >= 0`),
]);

export const donations = pgTable("donations", {
  id: uuid("id").primaryKey().defaultRandom(),
  donorName: text("donor_name").notNull(),
  donorPhone: text("donor_phone"),
  amount: numeric("amount", { precision: 12, scale: 2, mode: "number" }).notNull(),
  eventId: uuid("event_id").references(() => events.id),
  paymentMode: text("payment_mode").notNull().default("cash"),
  transactionRef: text("transaction_ref"),
  receiptNo: text("receipt_no").notNull().unique(),
  smsSent: boolean("sms_sent").notNull().default(false),
  receivedBy: uuid("received_by").references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [check("positive_donation", sql`${t.amount} > 0`)]);

export const circulars = pgTable("circulars", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  pinned: boolean("pinned").notNull().default(false),
  authorId: uuid("author_id").references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  actorId: uuid("actor_id").references(() => profiles.id),
  targetId: uuid("target_id"),
  amount: numeric("amount", { precision: 12, scale: 2, mode: "number" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
