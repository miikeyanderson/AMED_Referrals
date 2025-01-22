import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from 'ws';
import { setupAuth } from "./auth";
import { db } from "@db";
import { referrals, rewards, alerts, type User, type Referral, type Alert } from "@db/schema";
import { eq, desc, and, or, like, sql, inArray } from "drizzle-orm";
import { logUnauthorizedAccess, logServerError } from "./utils/logger";
import { users } from "@db/schema";
import { add, format, startOfWeek, endOfWeek, parseISO, isWithinInterval } from "date-fns";

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
 *     Alert:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         type:
 *           type: string
 *         message:
 *           type: string
 *         read:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 * */

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
   * */
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
   * */
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
   * */
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
   * */
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
   * */
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
   * */
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
        conditions.push(eq(referrals.department, department));
      }

      if (role) {
        const usersByRole = db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.role, role))
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
   * */
  app.get("/api/recruiter/referrals/pipeline", checkAuth, async (req: Request, res: Response) => {
    try {
      const { department, role, recruiterId } = req.query;

      // Build base conditions for filtering
      let conditions = [];

      if (department) {
        conditions.push(sql`${referrals.department} = ${department}`);
      }

      if (role) {
        const usersByRole = db
          .select({ id: users.id })
          .from(users)
          .where(sql`${users.role} = ${role}`)
          .as('usersByRole');

        conditions.push(
          sql`${referrals.referrerId} IN (SELECT id FROM ${usersByRole})`
        );
      }

      if (recruiterId) {
        conditions.push(sql`${referrals.referrerId} = ${parseInt(recruiterId as string)}`);
      }

      // Construct the WHERE clause if conditions exist
      const whereClause = conditions.length > 0
        ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
        : sql``;

      // Get total count and status breakdown in a single query
      const statusBreakdown = await db.execute(sql`
        WITH status_counts AS (
          SELECT
            status,
            COUNT(*) as count
          FROM ${referrals}
          ${whereClause}
          GROUP BY status
        ),
        total AS (
          SELECT SUM(count) as total
          FROM status_counts
        )
        SELECT
          status_counts.status,
          status_counts.count,
          ROUND(CAST(status_counts.count AS DECIMAL) / NULLIF(total.total, 0) * 100, 2) as percentage
        FROM status_counts, total
        ORDER BY
          CASE status
            WHEN 'pending' THEN 1
            WHEN 'contacted' THEN 2
            WHEN 'interviewing' THEN 3
            WHEN 'hired' THEN 4
            WHEN 'rejected' THEN 5
          END
      `);

      // Calculate total from the results
      const total = statusBreakdown.reduce((sum, row) => sum + Number(row.count), 0);

      res.json({
        total,
        statusBreakdown: statusBreakdown.map(row => ({
          status: row.status,
          count: Number(row.count),
          percentage: Number(row.percentage) || 0
        }))
      });
    } catch (error) {
      logServerError(error as Error, {
        context: 'pipeline-snapshot',
        userId: req.user?.id,
        role: req.user?.role,
        query: req.query
      });
      res.status(500).send("Failed to fetch pipeline snapshot");
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
   * */
  app.get("/api/recruiter/kpis", checkAuth, async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
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
   * */
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
   * */
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
  const httpServer = createServer(app);

  // Initialize WebSocket server for real-time notifications
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    // Skip vite HMR connections
    const protocol = ws.protocol;
    if (protocol === 'vite-hmr') {
      return;
    }

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        // Handle incoming WebSocket messages if needed
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
  });

  return httpServer;
}