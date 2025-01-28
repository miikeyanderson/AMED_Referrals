import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, index, jsonb, varchar, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Existing enums
export const roleEnum = pgEnum('role', ['recruiter', 'clinician', 'leadership']);
export const referralStatusEnum = pgEnum('referral_status', ['pending', 'contacted', 'interviewing', 'hired', 'rejected']);
export const alertTypeEnum = pgEnum('alert_type', ['new_referral', 'pipeline_update', 'system_notification']);
export const activityTypeEnum = pgEnum('activity_type', [
  'view_referral',
  'submit_referral',
  'check_rewards',
  'view_resources',
  'update_profile',
  'view_pending'
]);

// New enum for job specialties
export const specialtyEnum = pgEnum('specialty', [
  'nursing',
  'physician',
  'therapy',
  'pharmacy',
  'technician',
  'administrative',
  'other'
]);

// Jobs table with comprehensive fields and indexes for efficient querying
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  specialty: specialtyEnum("specialty").notNull(),
  location: jsonb("location").notNull(), // Structured location data including city, state, coordinates
  basePay: decimal("base_pay", { precision: 10, scale: 2 }).notNull(),
  bonusAmount: decimal("bonus_amount", { precision: 10, scale: 2 }),
  bonusDetails: text("bonus_details"),
  description: text("description").notNull(),
  requirements: text("requirements").notNull(),
  benefits: jsonb("benefits"), // Array of benefit details
  shift: varchar("shift", { length: 50 }), // e.g., "day", "night", "rotating"
  type: varchar("type", { length: 50 }).notNull(), // e.g., "full-time", "part-time", "contract"
  department: varchar("department", { length: 100 }),
  facility: varchar("facility", { length: 200 }).notNull(),
  recruiterId: integer("recruiter_id").references(() => users.id).notNull(),
  status: varchar("status", { length: 50 }).notNull().default('active'),
  startDate: timestamp("start_date"),
  expiryDate: timestamp("expiry_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Indexes for filtering and sorting
  specialtyIdx: index("jobs_specialty_idx").on(table.specialty),
  locationIdx: index("jobs_location_idx").on(table.location),
  basePayIdx: index("jobs_base_pay_idx").on(table.basePay),
  bonusAmountIdx: index("jobs_bonus_amount_idx").on(table.bonusAmount),
  statusIdx: index("jobs_status_idx").on(table.status),
  recruiterIdx: index("jobs_recruiter_idx").on(table.recruiterId),
  createdAtIdx: index("jobs_created_at_idx").on(table.createdAt),
  expiryDateIdx: index("jobs_expiry_date_idx").on(table.expiryDate),
}));

// Enhanced validation schema for job creation/updating
export const jobSubmissionSchema = z.object({
  title: z.string()
    .min(3, "Title must be at least 3 characters long")
    .max(200, "Title cannot exceed 200 characters"),
  specialty: z.enum(['nursing', 'physician', 'therapy', 'pharmacy', 'technician', 'administrative', 'other']),
  location: z.object({
    city: z.string(),
    state: z.string(),
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }).optional(),
  }),
  basePay: z.number()
    .min(0, "Base pay must be non-negative")
    .transform(val => Number(val.toFixed(2))),
  bonusAmount: z.number()
    .min(0, "Bonus amount must be non-negative")
    .optional()
    .transform(val => val ? Number(val.toFixed(2)) : undefined),
  bonusDetails: z.string().optional(),
  description: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description cannot exceed 5000 characters"),
  requirements: z.string()
    .min(10, "Requirements must be at least 10 characters")
    .max(2000, "Requirements cannot exceed 2000 characters"),
  benefits: z.array(z.string()).optional(),
  shift: z.string().optional(),
  type: z.string(),
  department: z.string().optional(),
  facility: z.string(),
  startDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional(),
});

// Activity tracking table
export const userActivities = pgTable("user_activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  activityType: activityTypeEnum("activity_type").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_activities_user_id_idx").on(table.userId),
  activityTypeIdx: index("user_activities_type_idx").on(table.activityType),
  createdAtIdx: index("user_activities_created_at_idx").on(table.createdAt)
}));

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
  resumeUrl: text("resume_url"),  // URL to the stored resume file
  skillTags: text("skill_tags").array(), // Array of skills
  socialLinks: jsonb("social_links"), // JSON object containing LinkedIn, GitHub, etc.
  source: text("source"), // Where the candidate was referred from
  actionHistory: jsonb("action_history").array(), // Array of timestamped actions
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
export type UserActivity = typeof userActivities.$inferSelect;
export type InsertUserActivity = typeof userActivities.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;

// Schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertReferralSchema = createInsertSchema(referrals);
export const selectReferralSchema = createSelectSchema(referrals);
export const insertAlertSchema = createInsertSchema(alerts);
export const selectAlertSchema = createSelectSchema(alerts);
export const insertUserActivitySchema = createInsertSchema(userActivities);
export const selectUserActivitySchema = createSelectSchema(userActivities);
export const insertJobSchema = createInsertSchema(jobs);
export const selectJobSchema = createSelectSchema(jobs);

// Export validation schemas
export { jobSubmissionSchema, referralSubmissionSchema };