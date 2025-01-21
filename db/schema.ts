import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const roleEnum = pgEnum('role', ['recruiter', 'clinician', 'leadership']);
export const referralStatusEnum = pgEnum('referral_status', ['pending', 'contacted', 'interviewing', 'hired', 'rejected']);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  role: roleEnum("role").notNull().default('clinician'),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  usernameIdx: index("username_idx").on(table.username),
  emailIdx: index("email_idx").on(table.email),
  roleIdx: index("role_idx").on(table.role)
}));

export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").references(() => users.id).notNull(),
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
}, (table) => ({
  statusIdx: index("status_idx").on(table.status),
  referrerIdx: index("referrer_idx").on(table.referrerId),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
  candidateEmailIdx: index("candidate_email_idx").on(table.candidateEmail)
}));

export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  referralId: integer("referral_id").references(() => referrals.id).notNull(),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default('pending'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  referralIdx: index("reward_referral_idx").on(table.referralId),
  statusIdx: index("reward_status_idx").on(table.status)
}));

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;
export type Reward = typeof rewards.$inferSelect;
export type InsertReward = typeof rewards.$inferInsert;

// Schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertReferralSchema = createInsertSchema(referrals);
export const selectReferralSchema = createSelectSchema(referrals);