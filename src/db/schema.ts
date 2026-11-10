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
  googleEmail: text("google_email"),
  // One Google account links to at most one profile. NULL (not linked) may repeat. Created by seed.ts.
  googleSub: text("google_sub").unique(),
  isMinor: boolean("is_minor").notNull().default(false),
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
  idempotencyKey: text("idempotency_key").unique(),
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
  receiptPhotoUrl: text("receipt_photo_url"),
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
  idempotencyKey: text("idempotency_key").unique(),
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

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(), // 64-character random cryptographic token
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const actionIdempotency = pgTable("action_idempotency", {
  key: text("key").primaryKey(), // unique action mutation key from client
  action: text("action").notNull(),
  userId: uuid("user_id").references(() => profiles.id),
  responsePayload: text("response_payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Better Auth core tables
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Single-use invite and onboarding claim codes (8 characters Crockford Base32)
export const claimCodes = pgTable("claim_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  codeHash: text("code_hash").notNull().unique(),
  memberId: uuid("member_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  issuedBy: uuid("issued_by").notNull().references(() => profiles.id),
  claimedByGoogleSub: text("claimed_by_google_sub"),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Membership applications from public visitors signing in via Google
export const membershipApplications = pgTable("membership_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  googleSub: text("google_sub").notNull(),
  googleEmail: text("google_email").notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  isMinor: boolean("is_minor").notNull().default(false),
  guardianName: text("guardian_name"),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"), // 'pending' | 'approved' | 'rejected'
  reviewedBy: uuid("reviewed_by").references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
