import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { referrals, rewards, type User, type Referral } from "@db/schema";
import { eq, desc, and, or, like, sql } from "drizzle-orm";
import { logUnauthorizedAccess, logServerError } from "./utils/logger";
import { referralSubmissionSchema, referrals } from "@db/schema";
import { ZodError } from "zod";
import { sanitizeHtml } from "./utils/sanitize";

declare global {
  namespace Express {
    interface User extends Omit<User, 'password'> {
      id: number;
      role: string;
    }
  }
}

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Rate limit test endpoint
  app.get("/api/rate-limit-test", (req: Request, res: Response) => {
    const rateLimitInfo = (req as any).rateLimit;
    res.json({
      success: true,
      message: "Rate limit test endpoint",
      rateLimitInfo: {
        requestCount: rateLimitInfo?.currentCount || 0,
        remainingRequests: rateLimitInfo?.remaining || 0,
        resetTime: new Date(rateLimitInfo?.resetTime || Date.now()).toISOString()
      }
    });
  });

  const checkAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      const ip = req.ip || req.socket.remoteAddress || '0.0.0.0';
      logUnauthorizedAccess(-1, ip, req.path);
      return res.status(401).send("Not authenticated");
    }
    next();
  };

  // Analytics endpoint
  app.get("/api/analytics", checkAuth, async (req: Request, res: Response) => {
    try {
      // Get total referrals count
      const [totalReferrals] = await db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(referrals)
        .where(
          req.user?.role === 'clinician'
            ? eq(referrals.referrerId, req.user.id)
            : undefined
        );

      // Get active referrals (pending, contacted, interviewing)
      const [activeReferrals] = await db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(referrals)
        .where(
          and(
            req.user?.role === 'clinician'
              ? eq(referrals.referrerId, req.user.id)
              : undefined,
            or(
              eq(referrals.status, 'pending'),
              eq(referrals.status, 'contacted'),
              eq(referrals.status, 'interviewing')
            )
          )
        );

      // Get total rewards
      const [totalRewards] = await db
        .select({
          sum: sql<number>`coalesce(sum(amount), 0)`
        })
        .from(rewards)
        .where(
          req.user?.role === 'clinician'
            ? eq(rewards.userId, req.user.id)
            : undefined
        );

      res.json({
        totalReferrals: totalReferrals?.count || 0,
        activeReferrals: activeReferrals?.count || 0,
        totalRewards: `$${totalRewards?.sum || 0}`,
      });
    } catch (error) {
      logServerError(error as Error, {
        context: 'analytics',
        userId: req.user?.id,
        role: req.user?.role
      });
      res.status(500).send("Failed to fetch analytics");
    }
  });

  // Referral routes
  app.get("/api/referrals", checkAuth, async (req: Request, res: Response) => {
    try {
      const { status, search, page = 1, limit = 10 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let baseQuery = db.select().from(referrals);
      let conditions = [];

      // Apply filters based on role
      if (req.user?.role === 'clinician') {
        conditions.push(eq(referrals.referrerId, req.user.id));
      }

      // Apply status filter if provided
      if (status && status !== 'all') {
        conditions.push(eq(referrals.status, status as Referral['status']));
      }

      // Apply search filter if provided
      if (search) {
        conditions.push(
          or(
            like(referrals.candidateName, `%${search}%`),
            like(referrals.candidateEmail, `%${search}%`),
            like(referrals.position, `%${search}%`)
          )
        );
      }

      let query = conditions.length > 0
        ? baseQuery.where(and(...conditions))
        : baseQuery;

      const referralsList = await query
        .orderBy(desc(referrals.createdAt))
        .limit(Number(limit))
        .offset(offset);

      res.json(referralsList);
    } catch (error) {
      logServerError(error as Error, {
        context: 'get-referrals',
        userId: req.user?.id,
        role: req.user?.role,
        query: req.query
      });
      res.status(500).send("Failed to fetch referrals");
    }
  });

  // Clinician-specific referral submission endpoint
  app.post("/api/referrals", checkAuth, async (req: Request, res: Response) => {
    if (req.user?.role !== 'clinician') {
      const ip = req.ip || req.socket.remoteAddress || '0.0.0.0';
      logUnauthorizedAccess(
        req.user?.id || -1,
        ip,
        '/api/referrals',
        'clinician'
      );
      return res.status(403).json({
        error: "Only clinicians can submit referrals",
        code: "FORBIDDEN"
      });
    }

    try {
      // First, sanitize the input data
      const sanitizedData = {
        ...req.body,
        candidateName: sanitizeHtml(req.body.candidateName),
        candidateEmail: sanitizeHtml(req.body.candidateEmail),
        candidatePhone: req.body.candidatePhone ? sanitizeHtml(req.body.candidatePhone) : undefined,
        position: sanitizeHtml(req.body.position),
        department: req.body.department ? sanitizeHtml(req.body.department) : undefined,
        experience: req.body.experience ? sanitizeHtml(req.body.experience) : undefined,
        notes: req.body.notes ? sanitizeHtml(req.body.notes) : undefined,
      };

      // Validate the sanitized data
      const validatedData = referralSubmissionSchema.parse(sanitizedData);

      // Create the referral with validated and sanitized data
      const newReferral = {
        ...validatedData,
        referrerId: req.user.id,
        status: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const [createdReferral] = await db
        .insert(referrals)
        .values(newReferral)
        .returning();

      res.status(201).json({
        success: true,
        data: createdReferral,
        message: "Referral submitted successfully"
      });

    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        return res.status(400).json({
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: validationErrors
        });
      }

      logServerError(error as Error, {
        context: 'create-referral',
        userId: req.user?.id,
        role: req.user?.role,
        payload: req.body
      });

      res.status(500).json({
        error: "Failed to create referral",
        code: "SERVER_ERROR"
      });
    }
  });

  app.get("/api/referrals/:id", checkAuth, async (req: Request, res: Response) => {
    try {
      const [referral] = await db
        .select()
        .from(referrals)
        .where(eq(referrals.id, parseInt(req.params.id)));

      if (!referral) {
        return res.status(404).send("Referral not found");
      }

      // Check if user has access to this referral
      if (req.user?.role === 'clinician' && referral.referrerId !== req.user.id) {
        const ip = req.ip || req.socket.remoteAddress || '0.0.0.0';
        logUnauthorizedAccess(
          req.user.id,
          ip,
          `/api/referrals/${req.params.id}`,
          'owner'
        );
        return res.status(403).send("Access denied");
      }

      res.json(referral);
    } catch (error) {
      logServerError(error as Error, {
        context: 'get-referral',
        userId: req.user?.id,
        role: req.user?.role,
        referralId: req.params.id
      });
      res.status(500).send("Failed to fetch referral");
    }
  });

  app.patch("/api/referrals/:id", checkAuth, async (req: Request, res: Response) => {
    if (req.user?.role === 'clinician') {
      const ip = req.ip || req.socket.remoteAddress || '0.0.0.0';
      logUnauthorizedAccess(
        req.user.id,
        ip,
        `/api/referrals/${req.params.id}`,
        'recruiter/leadership'
      );
      return res.status(403).send("Access denied");
    }

    try {
      const [updatedReferral] = await db
        .update(referrals)
        .set({
          ...req.body,
          updatedAt: new Date(),
        })
        .where(eq(referrals.id, parseInt(req.params.id)))
        .returning();

      if (!updatedReferral) {
        return res.status(404).send("Referral not found");
      }

      res.json(updatedReferral);
    } catch (error) {
      logServerError(error as Error, {
        context: 'update-referral',
        userId: req.user?.id,
        role: req.user?.role,
        referralId: req.params.id
      });
      res.status(500).send("Failed to update referral");
    }
  });

  // Rewards routes
  app.get("/api/rewards", checkAuth, async (req: Request, res: Response) => {
    try {
      const userRewards = await db
        .select()
        .from(rewards)
        .where(eq(rewards.userId, req.user?.id))
        .orderBy(desc(rewards.createdAt));
      res.json(userRewards);
    } catch (error) {
      logServerError(error as Error, {
        context: 'get-rewards',
        userId: req.user?.id,
        role: req.user?.role
      });
      res.status(500).send("Failed to fetch rewards");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}