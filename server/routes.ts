import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import { setupAuth } from "./auth";
import { db } from "@db";
import { alerts, referrals, rewards, users, type Alert, type InsertAlert, type Referral } from "@db/schema";
import { eq, desc, and, or, like, sql, inArray } from "drizzle-orm";
import { logUnauthorizedAccess, logServerError } from "./utils/logger";
import { add, format, startOfWeek, endOfWeek, parseISO } from "date-fns";
import { referralSubmissionSchema } from "@db/schema";
import { ZodError } from "zod";
import { sanitizeHtml } from "./utils/sanitize";

// Type definitions
interface PipelineStage {
  stage: string;
  count: number;
  candidates: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
    department: string | null;
    lastActivity: Date;
    nextSteps: string | null;
    notes: string | null;
  }>;
}

type PipelineStages = Record<Referral['status'], PipelineStage>;

declare global {
  namespace Express {
    interface User {
      id: number;
      role: string;
    }
  }
}

// WebSocket clients store
const clients = new Set<WebSocket>();

export function registerRoutes(app: Express): Server {
  // Initialize WebSocket server
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws: WebSocket) => {
    clients.add(ws);

    ws.on('close', () => {
      clients.delete(ws);
    });
  });

  setupAuth(app);

  // Middleware for authentication check
  const checkAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      const ip = req.ip || req.socket.remoteAddress || '0.0.0.0';
      logUnauthorizedAccess(-1, ip, req.path);
      return res.status(401).send("Not authenticated");
    }
    next();
  };

  // Middleware for recruiter role check
  const checkRecruiterRole = (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'recruiter' && req.user?.role !== 'leadership') {
      const ip = req.ip || req.socket.remoteAddress || '0.0.0.0';
      logUnauthorizedAccess(
        req.user?.id || -1,
        ip,
        req.path,
        'recruiter/leadership'
      );
      return res.status(403).send("Access denied. Recruiter role required.");
    }
    next();
  };

  /**
   * @swagger
   * /api/recruiter/alerts:
   *   get:
   *     summary: Get recruiter alerts
   *     description: Retrieve alerts with optional filtering for unread alerts and pagination
   *     tags: [Alerts]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: query
   *         name: unreadOnly
   *         schema:
   *           type: boolean
   *         description: Filter for unread alerts only
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
   *           maximum: 50
   *           default: 20
   *         description: Number of alerts per page
   *     responses:
   *       200:
   *         description: List of alerts
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Alert'
   */
  app.get(
    "/api/recruiter/alerts",
    checkAuth,
    checkRecruiterRole,
    async (req: Request, res: Response) => {
      try {
        const { unreadOnly, page = 1, limit = 20 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = db
          .select()
          .from(alerts)
          .where(eq(alerts.userId, req.user!.id));

        if (unreadOnly === 'true') {
          query = query.where(eq(alerts.read, false));
        }

        const alertsList = await query
          .orderBy(desc(alerts.createdAt))
          .limit(Number(limit))
          .offset(offset);

        res.json(alertsList);
      } catch (error) {
        logServerError(error as Error, {
          context: 'get-alerts',
          userId: req.user?.id,
          role: req.user?.role,
          query: req.query
        });
        res.status(500).send("Failed to fetch alerts");
      }
    }
  );

  /**
   * @swagger
   * /api/recruiter/alerts:
   *   post:
   *     summary: Create a new alert
   *     description: Create a new alert and broadcast it via WebSocket
   *     tags: [Alerts]
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - userId
   *               - type
   *               - message
   *             properties:
   *               userId:
   *                 type: integer
   *               type:
   *                 type: string
   *                 enum: [new_referral, pipeline_update, system_notification]
   *               message:
   *                 type: string
   *               relatedReferralId:
   *                 type: integer
   *     responses:
   *       201:
   *         description: Alert created successfully
   *       400:
   *         description: Invalid request body
   *       403:
   *         description: Not authorized
   */
  app.post(
    "/api/recruiter/alerts",
    checkAuth,
    checkRecruiterRole,
    async (req: Request, res: Response) => {
      try {
        const newAlert: InsertAlert = {
          userId: req.body.userId,
          type: req.body.type,
          message: req.body.message,
          read: false,
          relatedReferralId: req.body.relatedReferralId || null,
          createdAt: new Date()
        };

        const [createdAlert] = await db
          .insert(alerts)
          .values(newAlert)
          .returning();

        // Broadcast the new alert to all connected WebSocket clients
        const broadcastMessage = JSON.stringify({
          type: 'NEW_ALERT',
          data: createdAlert
        });

        clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(broadcastMessage);
          }
        });

        res.status(201).json(createdAlert);
      } catch (error) {
        logServerError(error as Error, {
          context: 'create-alert',
          userId: req.user?.id,
          role: req.user?.role,
          body: req.body
        });
        res.status(500).send("Failed to create alert");
      }
    }
  );

  /**
   * @swagger
   * /api/recruiter/alerts/{id}/read:
   *   patch:
   *     summary: Mark an alert as read
   *     description: Update the read status of a specific alert
   *     tags: [Alerts]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Alert ID
   *     responses:
   *       200:
   *         description: Alert updated successfully
   *       404:
   *         description: Alert not found
   */
  app.patch(
    "/api/recruiter/alerts/:id/read",
    checkAuth,
    checkRecruiterRole,
    async (req: Request, res: Response) => {
      try {
        const [updatedAlert] = await db
          .update(alerts)
          .set({
            read: true,
            readAt: new Date()
          })
          .where(
            and(
              eq(alerts.id, parseInt(req.params.id)),
              eq(alerts.userId, req.user!.id)
            )
          )
          .returning();

        if (!updatedAlert) {
          return res.status(404).send("Alert not found");
        }

        res.json(updatedAlert);
      } catch (error) {
        logServerError(error as Error, {
          context: 'mark-alert-read',
          userId: req.user?.id,
          role: req.user?.role,
          alertId: req.params.id
        });
        res.status(500).send("Failed to update alert");
      }
    }
  );

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

  /**
   * @swagger
   * /api/recruiter/referrals/inflow:
   *   get:
   *     summary: Get referral inflow metrics
   *     description: Retrieve time-series data and metrics about referral inflow
   *     tags: [Analytics]
   *     parameters:
   *       - in: query
   *         name: timeframe
   *         schema:
   *           type: string
   *           enum: [week, month]
   *           default: week
   *         description: Time period for the metrics
   *       - in: query
   *         name: department
   *         schema:
   *           type: string
   *         description: Filter by department
   *       - in: query
   *         name: role
   *         schema:
   *           type: string
   *         description: Filter by role
   *     responses:
   *       200:
   *         description: Metrics successfully retrieved
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 currentPeriod:
   *                   type: object
   *                   properties:
   *                     startDate:
   *                       type: string
   *                       format: date-time
   *                     endDate:
   *                       type: string
   *                       format: date-time
   *                     total:
   *                       type: integer
   *                 previousPeriod:
   *                   type: object
   *                   properties:
   *                     startDate:
   *                       type: string
   *                       format: date-time
   *                     endDate:
   *                       type: string
   *                       format: date-time
   *                     total:
   *                       type: integer
   *                 percentageChange:
   *                   type: number
   *                 timeSeries:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       date:
   *                         type: string
   *                         format: date
   *                       count:
   *                         type: integer
   */
  app.get("/api/recruiter/referrals/inflow", checkAuth, async (req: Request, res: Response) => {
    try {
      const { timeframe = 'week', department, role } = req.query;

      // Validate timeframe
      if (timeframe !== 'week' && timeframe !== 'month') {
        return res.status(400).json({ message: "Invalid timeframe. Use 'week' or 'month'" });
      }

      // Calculate date ranges
      const now = new Date();
      let currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date;

      if (timeframe === 'week') {
        currentStart = startOfWeek(now, { weekStartsOn: 1 });
        currentEnd = endOfWeek(now, { weekStartsOn: 1 });
        previousStart = add(currentStart, { weeks: -1 });
        previousEnd = add(currentEnd, { weeks: -1 });
      } else {
        currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
        currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      }

      // Build base query conditions
      let conditions = [];

      if (department) {
        conditions.push(sql`${referrals.department} = ${department}`);
      }

      if (role) {
        const usersByRole = db
          .select({ id: users.id })
          .from(users)
          .where(sql`${users.role}::text = ${role}`)
          .as('usersByRole');

        conditions.push(
          inArray(
            referrals.referrerId,
            db.select({ id: usersByRole.id }).from(usersByRole)
          )
        );
      }

      // Get current period total
      const [currentTotal] = await db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(referrals)
        .where(
          and(
            sql`${referrals.createdAt} >= ${currentStart.toISOString()}`,
            sql`${referrals.createdAt} <= ${currentEnd.toISOString()}`,
            ...conditions
          )
        );

      // Get previous period total
      const [previousTotal] = await db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(referrals)
        .where(
          and(
            sql`${referrals.createdAt} >= ${previousStart.toISOString()}`,
            sql`${referrals.createdAt} <= ${previousEnd.toISOString()}`,
            ...conditions
          )
        );

      // Generate time series data for current period
      const timeSeries = await db
        .select({
          date: sql`date_trunc('day', ${referrals.createdAt})::date`,
          count: sql<number>`cast(count(*) as integer)`
        })
        .from(referrals)
        .where(
          and(
            sql`${referrals.createdAt} >= ${currentStart.toISOString()}`,
            sql`${referrals.createdAt} <= ${currentEnd.toISOString()}`,
            ...conditions
          )
        )
        .groupBy(sql`date_trunc('day', ${referrals.createdAt})::date`)
        .orderBy(sql`date_trunc('day', ${referrals.createdAt})::date`);

      // Fill in missing dates with zero counts
      const fullTimeSeries = [];
      let currentDate = currentStart;
      while (currentDate <= currentEnd) {
        const formattedDate = format(currentDate, 'yyyy-MM-dd');
        const existingEntry = timeSeries.find(
          entry => format(entry.date, 'yyyy-MM-dd') === formattedDate
        );

        fullTimeSeries.push({
          date: formattedDate,
          count: existingEntry ? existingEntry.count : 0
        });

        currentDate = add(currentDate, { days: 1 });
      }

      // Calculate percentage change
      const current = currentTotal?.count || 0;
      const previous = previousTotal?.count || 0;
      const percentageChange = previous === 0
        ? (current === 0 ? 0 : 100)
        : ((current - previous) / previous) * 100;

      res.json({
        currentPeriod: {
          startDate: currentStart.toISOString(),
          endDate: currentEnd.toISOString(),
          total: current
        },
        previousPeriod: {
          startDate: previousStart.toISOString(),
          endDate: previousEnd.toISOString(),
          total: previous
        },
        percentageChange,
        timeSeries: fullTimeSeries
      });
    } catch (error) {
      logServerError(error as Error, {
        context: 'referrals-inflow',
        userId: req.user?.id,
        role: req.user?.role,
        query: req.query
      });
      res.status(500).send("Failed to fetch referral inflow metrics");
    }
  });

  /**
   * @swagger
   * /api/recruiter/referrals/pipeline:
   *   get:
   *     summary: Get pipeline snapshot metrics
   *     description: Retrieve aggregated counts of referrals grouped by status with optional filtering
   *     tags: [Analytics]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: query
   *         name: department
   *         schema:
   *           type: string
   *         description: Filter by department
   *       - in: query
   *         name: role
   *         schema:
   *           type: string
   *         description: Filter by referrer role
   *       - in: query
   *         name: recruiterId
   *         schema:
   *           type: integer
   *         description: Filter by specific recruiter ID
   *     responses:
   *       200:
   *         description: Pipeline snapshot retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 total:
   *                   type: integer
   *                   description: Total number of referrals
   *                 statusBreakdown:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       status:
   *                         type: string
   *                         enum: [pending, contacted, interviewing, hired, rejected]
   *                       count:
   *                         type: integer
   *                       percentage:
   *                         type: number
   *       401:
   *         description: Not authenticated
   *       500:
   *         description: Server error while fetching pipeline snapshot
   */
  app.get("/api/recruiter/referrals/pipeline", checkAuth, async (req: Request, res: Response) => {
    try {
      const { department, role, recruiterId } = req.query;

      // Validate query parameters
      if (recruiterId && isNaN(parseInt(recruiterId as string))) {
        return res.status(400).json({
          error: "Invalid recruiterId parameter - must be a number"
        });
      }

      // Build base conditions for filtering
      let conditions = [];

      if (department) {
        conditions.push(sql`${referrals.department} = ${department}`);
      }

      if (role) {
        try {
          const usersByRole = db
            .select({ id: users.id })
            .from(users)
            .where(sql`${users.role} = ${role}`)
            .as('usersByRole');

          conditions.push(
            sql`${referrals.referrerId} IN (SELECT id FROM ${usersByRole})`
          );
        } catch (error) {
          logServerError(error as Error, {
            context: 'pipeline-snapshot-role-query',
            role: role,
            error: error
          });
          return res.status(400).json({
            error: "Invalid role parameter"
          });
        }
      }

      if (recruiterId) {
        conditions.push(sql`${referrals.referrerId} = ${parseInt(recruiterId as string)}`);
      }

      // Construct the WHERE clause if conditions exist
      const whereClause = conditions.length > 0
        ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
        : sql``;

      // Get total count and status breakdown in a single query
      interface StatusRow {
        status: string;
        count: string | number;
        percentage: string | number;
      }

      const result = await db.execute(sql`
        WITH all_statuses AS (
          SELECT unnest(ARRAY['pending', 'contacted', 'interviewing', 'hired', 'rejected']::referral_status[]) as status
        ),
        status_counts AS (
          SELECT
            all_statuses.status::text as status,
            COALESCE(COUNT(r.id), 0) as count
          FROM all_statuses
          LEFT JOIN ${referrals} r ON r.status = all_statuses.status
          ${whereClause}
          GROUP BY all_statuses.status
        ),
        total AS (
          SELECT COALESCE(SUM(count), 0) as total
          FROM status_counts
        )
        SELECT
          status_counts.status,
          status_counts.count::integer as count,
          ROUND(CASE 
            WHEN total.total = 0 THEN 0
            ELSE (status_counts.count::decimal / total.total * 100)
          END, 2) as percentage
        FROM status_counts, total
        ORDER BY
          CASE status_counts.status
            WHEN 'pending' THEN 1
            WHEN 'contacted' THEN 2
            WHEN 'interviewing' THEN 3
            WHEN 'hired' THEN 4
            WHEN 'rejected' THEN 5
          END
      `);

      const statusBreakdown = result.rows.map(row => ({
        status: row.status,
        count: Number(row.count),
        percentage: Number(row.percentage)
      }));

      if (!Array.isArray(statusBreakdown)) {
        throw new Error('Invalid database response format');
      }

      // Calculate total from the results
      const total = statusBreakdown.reduce((sum, row) => sum + Number(row.count), 0);

      // Ensure proper typing and null handling
      res.json({
        total,
        statusBreakdown: statusBreakdown.map(row => ({
          status: row.status || 'unknown',
          count: row.count ? Number(row.count) : 0,
          percentage: row.percentage ? Number(row.percentage) : 0
        }))
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';


      logServerError(error as Error, {
        context: 'pipeline-snapshot',
        userId: req.user?.id,
        role: req.user?.role,
        query: req.query,
        errorDetails: errorMessage
      });

      // Send more detailed error response
      res.status(500).json({
        error: "Failed to fetch pipeline snapshot",
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  });

  /**
   * @swagger
   * /api/recruiter/kpis:
   *   get:
   *     summary: Get recruiter KPI metrics
   *     description: Retrieve key performance indicators including conversion rates and time-to-hire metrics
   *     tags: [Analytics]
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: KPI metrics retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 conversionRate:
   *                   type: number
   *                   description: Percentage of referrals converted to hires
   *                 avgTimeToHire:
   *                   type: number
   *                   description: Average time to hire in days
   *                 trendAnalysis:
   *                   type: object
   *                   properties:
   *                     conversionRateChange:
   *                       type: number
   *                       description: Month-over-month change in conversion rate (percentage points)
   *                     timeToHireChange:
   *                       type: number
   *                       description: Month-over-month change in average time to hire (days)
   */
  app.get("/api/recruiter/kpis", checkAuth, async (req: Request, res: Response) => {
    try {
      // Mock KPI data for demonstration
      const kpiData = {
        conversionRate: {
          current: 65.5,
          target: 75,
          trend: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            value: 60 + Math.random() * 10
          })).reverse()
        },
        timeToHire: {
          current: 25,
          target: 21,
          trend: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            value: 20 + Math.random() * 10
          })).reverse()
        },
        activeRequisitions: 12,
        totalPlacements: 45
      };

      res.json(kpiData);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      // Get current month metrics
      const currentMetrics = await db.execute(sql`
        WITH hired_referrals AS (
          SELECT
            id,
            created_at,
            updated_at,
            EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400 as days_to_hire
          FROM ${referrals}
          WHERE
            status = 'hired'
            AND updated_at >= ${currentMonth.toISOString()}
            AND updated_at < ${now.toISOString()}
        ),
        total_referrals AS (
          SELECT COUNT(*) as total
          FROM ${referrals}
          WHERE created_at >= ${currentMonth.toISOString()}
        )
        SELECT
          COALESCE(COUNT(hired_referrals.id), 0) as hired_count,
          COALESCE(AVG(hired_referrals.days_to_hire), 0) as avg_days_to_hire,
          (SELECT total FROM total_referrals) as total_referrals
        FROM hired_referrals
      `);

      // Get last month metrics
      const lastMonthMetrics = await db.execute(sql`
        WITH hired_referrals AS (
          SELECT
            id,
            created_at,
            updated_at,
            EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400 as days_to_hire
          FROM ${referrals}
          WHERE
            status = 'hired'
            AND updatedat >= ${lastMonth.toISOString()}
            AND updated_at < ${currentMonth.toISOString()}
        ),
        total_referrals AS (
          SELECT COUNT(*) as total
          FROM ${referrals}
          WHERE created_at >= ${lastMonth.toISOString()}
            AND created_at < ${currentMonth.toISOString()}
        )
        SELECT
          COALESCE(COUNT(hired_referrals.id), 0) as hired_count,
          COALESCE(AVG(hired_referrals.days_to_hire), 0) as avg_days_to_hire,
          (SELECT total FROM total_referrals) as total_referrals
        FROM hired_referrals
      `);

      // Calculate current month KPIs
      const current = currentMetrics[0];
      const currentConversionRate = current.total_referrals > 0
        ? (Number(current.hired_count) / Number(current.total_referrals)) * 100
        : 0;
      const currentTimeToHire = Number(current.avg_days_to_hire);

      // Calculate last month KPIs
      const last = lastMonthMetrics[0];
      const lastConversionRate = last.total_referrals > 0
        ? (Number(last.hired_count) / Number(last.total_referrals)) * 100
        : 0;
      const lastTimeToHire = Number(last.avg_days_to_hire);

      // Calculate month-over-month changes
      const conversionRateChange = currentConversionRate - lastConversionRate;
      const timeToHireChange = currentTimeToHire - lastTimeToHire;

      res.json({
        conversionRate: Number(currentConversionRate.toFixed(2)),
        avgTimeToHire: Number(currentTimeToHire.toFixed(1)),
        trendAnalysis: {
          conversionRateChange: Number(conversionRateChange.toFixed(2)),
          timeToHireChange: Number(timeToHireChange.toFixed(1))
        }
      });
    } catch (error) {
      logServerError(error as Error, {
        context: 'recruiter-kpis',
        userId: req.user?.id,
        role: req.user?.role
      });
      res.status(500).send("Failed to fetch KPI metrics");
    }
  });

  /**
   * @swagger
   * /api/recruiter/alerts:
   *   get:
   *     summary: Get user alerts
   *     description: Retrieve alerts/notifications for the authenticated user
   *     tags: [Alerts]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *           enum: [new_referral, pipeline_update, system_notification]
   *         description: Filter alerts by type
   *       - in: query
   *         name: read
   *         schema:
   *           type: boolean
   *         description: Filter by read status
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 50
   *         description: Number of alerts to return
   *     responses:
   *       200:
   *         description: List of alerts
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 alerts:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: integer
   *                       type:
   *                         type: string
   *                       message:
   *                         type: string
   *                       read:
   *                         type: boolean
   *                       createdAt:
   *                         type: string
   *                         format: date-time
   *                 unreadCount:
   *                   type: integer
   *       401:
   *         description: Not authenticated
   *       500:
   *         description: Server error
   */
  app.get("/api/recruiter/alerts", checkAuth, async (req: Request, res: Response) => {
    try {
      const { type, read, limit = 50 } = req.query;

      // Build query conditions
      let conditions = [eq(alerts.userId, req.user!.id)];

      if (type) {
        conditions.push(eq(alerts.type, type as Alert['type']));
      }

      if (typeof read !== 'undefined') {
        conditions.push(eq(alerts.read, read === 'true'));
      }

      // Get alerts with pagination
      const userAlerts = await db
        .select()
        .from(alerts)
        .where(and(...conditions))
        .orderBy(desc(alerts.createdAt))
        .limit(Number(limit));

      // Get unread count
      const [unreadCount] = await db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(alerts)
        .where(and(
          eq(alerts.userId, req.user!.id),
          eq(alerts.read, false)
        ));

      res.json({
        alerts: userAlerts,
        unreadCount: unreadCount?.count || 0
      });
    } catch (error) {
      logServerError(error as Error, {
        context: 'get-alerts',
        userId: req.user?.id,
        role: req.user?.role
      });
      res.status(500).send("Failed to fetch alerts");
    }
  });

  /**
   * @swagger
   * /api/recruiter/alerts/mark-as-read:
   *   post:
   *     summary: Mark alerts as read
   *     description: Mark one or multiple alerts as read
   *     tags: [Alerts]
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               alertIds:
   *                 type: array
   *                 items:
   *                   type: integer
   *               all:
   *                 type: boolean
   *                 description: If true, mark all alerts as read
   *     responses:
   *       200:
   *         description: Alerts marked as read successfully
   *       401:
   *         description: Not authenticated
   *       403:
   *         description: Not authorized to mark these alerts
   *       500:
   *         description: Server error
   */
  app.post("/api/recruiter/alerts/mark-as-read", checkAuth, async (req: Request, res: Response) => {
    try {
      const { alertIds, all } = req.body;

      if (all) {
        // Mark all user's alerts as read
        await db
          .update(alerts)
          .set({
            read: true,
            readAt: new Date()
          })
          .where(eq(alerts.userId, req.user!.id));
      } else if (Array.isArray(alertIds) && alertIds.length > 0) {
        // Mark specific alerts as read
        await db
          .update(alerts)
          .set({
            read: true,
            readAt: new Date()
          })
          .where(
            and(
              eq(alerts.userId, req.user!.id),
              inArray(alerts.id, alertIds)
            )
          );
      } else {
        return res.status(400).json({ message: "Either 'alertIds' array or 'all' must be provided" });
      }

      res.json({ success: true });
    } catch (error) {
      logServerError(error as Error, {
        context: 'mark-alerts-read',
        userId: req.user?.id,
        role: req.user?.role
      });
      res.status(500).send("Failed to mark alerts as read");
    }
  });

  // Create HTTP server first
  // Initialize WebSocket server for real-time notifications
  //wss.on('connection', (ws) => {
  //  // Skip vite HMR connections
  //  const protocol = ws.protocol;
  //  if (protocol === 'vite-hmr') {
  //    return;
  //  }
  //
  //  ws.on('message', (message) => {
  //    try {
  //      const data = JSON.parse(message.toString());
  //      // Handle incoming WebSocket messages if needed
  //    } catch (error) {
  //      console.error('WebSocket message error:', error);
  //    }
  //  });
  //});

  // Add the new pipeline route here
  /**
   * @swagger
   * /api/recruiter/pipeline:
   *   get:
   *     summary: Get recruitment pipeline data
   *     description: Retrieve candidate data grouped by pipeline stages with filtering and pagination
   *     tags: [Pipeline]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: query
   *         name: role
   *         schema:
   *           type: string
   *         description: Filter by job role
   *       - in: query
   *         name: source
   *         schema:
   *           type: string
   *         description: Filter by referral source
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Start date for date range filter
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *         description: End date for date range filter
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 50
   *           default: 10
   *         description: Number of items per page
   *     responses:
   *       200:
   *         description: Pipeline data retrieved successfully
   *       401:
   *         description: Not authenticated
   *       403:
   *         description: Not authorized (non-recruiter users)
   */
  app.get(
    "/api/recruiter/pipeline",
    checkAuth,
    checkRecruiterRole,
    async (req: Request, res: Response) => {
      try {
        const {
          role,
          source,
          startDate,
          endDate,
          page = 1,
          limit = 10
        } = req.query;

        const offset = (Number(page) - 1) * Number(limit);

        // Build base query conditions
        let conditions = [];

        if (role) {
          conditions.push(like(referrals.position, `%${role}%`));
        }

        if (startDate && endDate) {
          conditions.push(
            and(
              sql`${referrals.createdAt} >= ${new Date(startDate as string).toISOString()}`,
              sql`${referrals.createdAt} <= ${new Date(endDate as string).toISOString()}`
            )
          );
        }

        // Get total count for pagination
        const [{ count }] = await db
          .select({ count: sql<number>`cast(count(*) as integer)` })
          .from(referrals)
          .where(conditions.length > 0 ? and(...conditions) : undefined);

        // Fetch referrals with pagination
        const pipelineData = await db
          .select({
            id: referrals.id,
            candidateName: referrals.candidateName,
            candidateEmail: referrals.candidateEmail,
            position: referrals.position,
            department: referrals.department,
            status: referrals.status,
            createdAt: referrals.createdAt,
            updatedAt: referrals.updatedAt,
            nextSteps: referrals.nextSteps,
            notes: referrals.notes
          })
          .from(referrals)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(referrals.updatedAt))
          .limit(Number(limit))
          .offset(offset);

        // Define pipeline stages
        const stages = ['pending', 'contacted', 'interviewing', 'hired', 'rejected'] as const;
        const pipeline = stages.reduce((acc, stage) => {
          const stageData: PipelineStage = {
            stage,
            count: pipelineData.filter(r => r.status === stage).length,
            candidates: pipelineData
              .filter(r => r.status === stage)
              .map(r => ({
                id: r.id,
                name: r.candidateName,
                email: r.candidateEmail,
                role: r.position,
                department: r.department,
                lastActivity: r.updatedAt,
                nextSteps: r.nextSteps,
                notes: r.notes
              }))
          };
          acc[stage] = stageData;
          return acc;
        }, {} as PipelineStages);

        res.json({
          pipeline,
          pagination: {
            total: count,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(count / Number(limit))
          }
        });
      } catch (error) {
        logServerError(error as Error, {
          context: 'get-pipeline',
          userId: req.user?.id,
          role: req.user?.role,
          query: req.query
        });
        res.status(500).json({
          error: "Failed to fetch pipeline data",
          code: "SERVER_ERROR"
        });
      }
    }
  );

  // Add after the existing /api/rewards endpoint...

  /**
   * @swagger
   * /api/recruiter/pipeline:
   *   get:
   *     summary: Get recruiter pipeline data
   *     description: Retrieve candidates grouped by their pipeline stages
   *     tags: [Pipeline]
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: Pipeline data retrieved successfully
   *       401:
   *         description: Not authenticated
   *       403:
   *         description: Not authorized
   */
  app.get(
    "/api/recruiter/pipeline",
    checkAuth,
    checkRecruiterRole,
    async (req: Request, res: Response) => {
      try {
        const result = await db
          .select({
            id: referrals.id,
            status: referrals.status,
            candidateName: referrals.candidateName,
            candidateEmail: referrals.candidateEmail,
            role: referrals.position,
            department: referrals.department,
            lastActivity: referrals.updatedAt,
            nextSteps: referrals.nextSteps,
            notes: referrals.notes,
          })
          .from(referrals)
          .orderBy(desc(referrals.updatedAt));

        // Group candidates by their pipeline stage
        const pipelineData = result.reduce((acc: Record<string, any[]>, candidate) => {
          const stage = candidate.status;
          if (!acc[stage]) {
            acc[stage] = [];
          }
          acc[stage].push(candidate);
          return acc;
        }, {});

        res.json(pipelineData);
      } catch (error) {
        logServerError(error as Error, {
          context: 'get-pipeline',
          userId: req.user?.id,
          role: req.user?.role,
        });
        res.status(500).send("Failed to fetch pipeline data");
      }
    }
  );

  /**
   * @swagger
   * /api/recruiter/pipeline/update-stage:
   *   post:
   *     summary: Update candidate stage
   *     description: Update the pipeline stage of a candidate
   *     tags: [Pipeline]
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - candidateId
   *               - newStage
   *             properties:
   *               candidateId:
   *                 type: integer
   *               newStage:
   *                 type: string
   *                 enum: [new, contacted, interviewing, hired, rejected]
   *     responses:
   *       200:
   *         description: Candidate stage updated successfully
   *       400:
   *         description: Invalid request body
   *       401:
   *         description: Not authenticated
   *       403:
   *         description: Not authorized
   *       404:
   *         description: Candidate not found
   */
  app.post(
    "/api/recruiter/pipeline/update-stage",
    checkAuth,
    checkRecruiterRole,
    async (req: Request, res: Response) => {
      try {
        const { candidateId, newStage } = req.body;

        if (!candidateId || !newStage) {
          return res.status(400).send("Missing required fields");
        }

        const [updatedReferral] = await db
          .update(referrals)
          .set({
            status: newStage,
            updatedAt: new Date(),
          })
          .where(eq(referrals.id, candidateId))
          .returning();

        if (!updatedReferral) {
          return res.status(404).send("Candidate not found");
        }

        // Create an alert for the referrer
        await db.insert(alerts).values({
          userId: updatedReferral.referrerId,
          type: "pipeline_update",
          message: `Candidate ${updatedReferral.candidateName} has been moved to ${newStage} stage`,
          read: false,
          relatedReferralId: updatedReferral.id,
          createdAt: new Date()
        });

        // Broadcast update via WebSocket
        const broadcastMessage = JSON.stringify({
          type: "PIPELINE_UPDATE",
          data: {
            candidateId,
            newStage,
            updatedAt: updatedReferral.updatedAt
          }
        });

        clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(broadcastMessage);
          }
        });

        res.json(updatedReferral);
      } catch (error) {
        logServerError(error as Error, {
          context: 'update-pipeline-stage',
          userId: req.user?.id,
          role: req.user?.role,
          candidateId: req.body.candidateId,
          newStage: req.body.newStage
        });
        res.status(500).send("Failed to update candidate stage");
      }
    }
  );

  return httpServer;
}