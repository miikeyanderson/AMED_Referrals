import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Existing enums
export const roleEnum = pgEnum('role', ['recruiter', 'clinician', 'leadership']);
export const referralStatusEnum = pgEnum('referral_status', ['pending', 'contacted', 'interviewing', 'hired', 'rejected']);

// Enhanced validation schema for referral submission
export const referralSubmissionSchema = z.object({
  candidateName: z.string()
    .min(2, "Name must be at least 2 characters long")
    .max(100, "Name cannot exceed 100 characters")
    .regex(/^[a-zA-Z\s\-']+$/, "Name can only contain letters, spaces, hyphens, and apostrophes")
    .transform(val => val.trim()),

  candidateEmail: z.string()
    .email("Invalid email address")
    .max(255, "Email cannot exceed 255 characters")
    .transform(val => val.toLowerCase().trim()),

  candidatePhone: z.string()
    .regex(/^\+?[\d\-\(\)\s]{10,20}$/, "Invalid phone number format")
    .optional()
    .transform(val => val ? val.replace(/\s+/g, '') : undefined),

  position: z.string()
    .min(2, "Position must be at least 2 characters long")
    .max(100, "Position cannot exceed 100 characters")
    .transform(val => val.trim()),

  department: z.string()
    .min(2, "Department must be at least 2 characters long")
    .max(50, "Department cannot exceed 50 characters")
    .optional()
    .transform(val => val ? val.trim() : undefined),

  experience: z.string()
    .max(1000, "Experience details cannot exceed 1000 characters")
    .optional()
    .transform(val => val ? val.trim() : undefined),

  notes: z.string()
    .max(2000, "Notes cannot exceed 2000 characters")
    .optional()
    .transform(val => val ? val.trim() : undefined),
});

// Database tables
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