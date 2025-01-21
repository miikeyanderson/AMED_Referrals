import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { referrals, rewards, type User, type Referral } from "@db/schema";
import { eq, desc, and, or, like, sql } from "drizzle-orm";
import { logUnauthorizedAccess, logServerError } from "./utils/logger";

declare global {
  namespace Express {
    interface User extends Omit<User, 'password'> {
      id: number;
      role: string;
    }
  }
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Referral:
 *       type: object
 *       required:
 *         - candidateName
 *         - candidateEmail
 *         - position
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier for the referral
 *         candidateName:
 *           type: string
 *           description: Full name of the candidate
 *         candidateEmail:
 *           type: string
 *           format: email
 *           description: Email address of the candidate
 *         position:
 *           type: string
 *           description: Position the candidate is being referred for
 *         status:
 *           type: string
 *           enum: [pending, contacted, interviewing, hired, rejected]
 *           description: Current status of the referral
 *     Analytics:
 *       type: object
 *       properties:
 *         totalReferrals:
 *           type: integer
 *           description: Total number of referrals
 *         activeReferrals:
 *           type: integer
 *           description: Number of active referrals
 *         totalRewards:
 *           type: string
 *           description: Total rewards earned (formatted as currency)
 */

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  /**
   * @swagger
   * /api/rate-limit-test:
   *   get:
   *     summary: Test endpoint for rate limiting
   *     description: Returns information about the current rate limit status
   *     tags: [System]
   *     responses:
   *       200:
   *         description: Rate limit information
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 rateLimitInfo:
   *                   type: object
   *                   properties:
   *                     requestCount:
   *                       type: integer
   *                     remainingRequests:
   *                       type: integer
   *                     resetTime:
   *                       type: string
   *                       format: date-time
   */
  app.get("/api/rate-limit-test", (req: Request, res: Response) => {
    const rateLimitInfo = req.rateLimit;
    res.json({
      success: true,
      message: "Rate limit test endpoint",
      rateLimitInfo: {
        requestCount: rateLimitInfo?.current || 0,
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

  /**
   * @swagger
   * /api/analytics:
   *   get:
   *     summary: Get user analytics
   *     description: Retrieve analytics data including total referrals, active referrals, and rewards
   *     tags: [Analytics]
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: Analytics data retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Analytics'
   *       401:
   *         description: Not authenticated
   *       500:
   *         description: Server error while fetching analytics
   */
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

  /**
   * @swagger
   * /api/referrals:
   *   get:
   *     summary: Get all referrals
   *     description: Retrieve a list of referrals with optional filtering
   *     tags: [Referrals]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [all, pending, contacted, interviewing, hired, rejected]
   *         description: Filter referrals by status
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search term for filtering referrals
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number for pagination
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 10
   *         description: Number of items per page
   *     responses:
   *       200:
   *         description: List of referrals
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Referral'
   *       401:
   *         description: Not authenticated
   *       500:
   *         description: Server error while fetching referrals
   *   post:
   *     summary: Create a new referral
   *     description: Submit a new referral (clinicians only)
   *     tags: [Referrals]
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Referral'
   *     responses:
   *       200:
   *         description: Referral created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Referral'
   *       401:
   *         description: Not authenticated
   *       403:
   *         description: Not authorized (non-clinician users)
   *       500:
   *         description: Server error while creating referral
   */
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

      const [{ count }] = await db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(referrals)
        .where(and(...conditions));

      const referralsList = await query
        .orderBy(desc(referrals.createdAt))
        .limit(Number(limit))
        .offset(offset);

      res.json({
        referrals: referralsList,
        total: count
      });
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

  app.post("/api/referrals", checkAuth, async (req: Request, res: Response) => {
    if (req.user?.role !== 'clinician') {
      const ip = req.ip || req.socket.remoteAddress || '0.0.0.0';
      logUnauthorizedAccess(
        req.user.id,
        ip,
        '/api/referrals',
        'clinician'
      );
      return res.status(403).send("Only clinicians can submit referrals");
    }

    try {
      const newReferral = {
        ...req.body,
        referrerId: req.user.id,
        status: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const [createdReferral] = await db
        .insert(referrals)
        .values(newReferral)
        .returning();

      res.json(createdReferral);
    } catch (error) {
      logServerError(error as Error, {
        context: 'create-referral',
        userId: req.user?.id,
        role: req.user?.role
      });
      res.status(500).send("Failed to create referral");
    }
  });

  /**
   * @swagger
   * /api/referrals/{id}:
   *   get:
   *     summary: Get a specific referral
   *     description: Retrieve details of a specific referral
   *     tags: [Referrals]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID of the referral
   *     responses:
   *       200:
   *         description: Referral details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Referral'
   *       401:
   *         description: Not authenticated
   *       403:
   *         description: Not authorized to view this referral
   *       404:
   *         description: Referral not found
   *       500:
   *         description: Server error while fetching referral
   *   patch:
   *     summary: Update a referral
   *     description: Update the status or details of a referral (recruiters/leadership only)
   *     tags: [Referrals]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID of the referral to update
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [pending, contacted, interviewing, hired, rejected]
   *     responses:
   *       200:
   *         description: Referral updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Referral'
   *       401:
   *         description: Not authenticated
   *       403:
   *         description: Not authorized (clinician users)
   *       404:
   *         description: Referral not found
   *       500:
   *         description: Server error while updating referral
   */
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

  /**
   * @swagger
   * /api/rewards:
   *   get:
   *     summary: Get user rewards
   *     description: Retrieve a list of rewards for the authenticated user
   *     tags: [Rewards]
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: List of user rewards
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: integer
   *                   userId:
   *                     type: integer
   *                   amount:
   *                     type: number
   *                   createdAt:
   *                     type: string
   *                     format: date-time
   *       401:
   *         description: Not authenticated
   *       500:
   *         description: Server error while fetching rewards
   */
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