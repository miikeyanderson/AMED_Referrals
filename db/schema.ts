import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const roleEnum = pgEnum('role', ['recruiter', 'clinician', 'leadership']);
export const referralStatusEnum = pgEnum('referral_status', ['pending', 'contacted', 'interviewing', 'hired', 'rejected']);
export const alertTypeEnum = pgEnum('alert_type', ['new_referral', 'pipeline_update', 'system_notification']);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  role: roleEnum("role").notNull().default('clinician'),
  name: text("name").notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").references(() => users.id),
  candidateName: text("candidate_name").notNull(),
  candidateEmail: text("candidate_email").notNull(),
  candidatePhone: text("candidate_phone"),
  position: text("position").notNull(),
  department: text("department"),
  experience: text("experience"),
  status: referralStatusEnum("status").notNull().default('pending'),
  notes: text("notes"),
  recruiterNotes: text("recruiter_notes"),
  nextSteps: text("next_steps"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  referralId: integer("referral_id").references(() => referrals.id),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default('pending'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: alertTypeEnum("type").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  relatedReferralId: integer("related_referral_id").references(() => referrals.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  readAt: timestamp("read_at")
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;
export type Reward = typeof rewards.$inferSelect;
export type InsertReward = typeof rewards.$inferInsert;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;

// Schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertReferralSchema = createInsertSchema(referrals);
export const selectReferralSchema = createSelectSchema(referrals);
export const insertAlertSchema = createInsertSchema(alerts);
export const selectAlertSchema = createSelectSchema(alerts);