import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { referrals, rewards, users } from "@db/schema";
import { eq, desc, and, or, like, sql } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Analytics endpoint
  app.get("/api/analytics", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      // Get total referrals count
      const [totalReferrals] = await db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(referrals)
        .where(
          req.user.role === 'clinician'
            ? eq(referrals.referrerId, req.user.id)
            : undefined
        );

      // Get active referrals (pending, contacted, interviewing)
      const [activeReferrals] = await db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(referrals)
        .where(
          and(
            req.user.role === 'clinician'
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
          req.user.role === 'clinician'
            ? eq(rewards.userId, req.user.id)
            : undefined
        );

      // Calculate trends (simplified for now)
      const referralTrend = "+12%";
      const activeTrend = "+8%";
      const rewardsTrend = "+15%";

      res.json({
        totalReferrals: totalReferrals?.count || 0,
        activeReferrals: activeReferrals?.count || 0,
        totalRewards: `$${totalRewards?.sum || 0}`,
        referralTrend,
        activeTrend,
        rewardsTrend,
      });
    } catch (error) {
      res.status(500).send("Failed to fetch analytics");
    }
  });

  // Referral routes
  app.get("/api/referrals", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const { status, search, page = 1, limit = 10 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let query = db.select().from(referrals);

      // Apply filters based on role
      if (req.user.role === 'clinician') {
        query = query.where(eq(referrals.referrerId, req.user.id));
      }

      // Apply status filter if provided
      if (status) {
        query = query.where(eq(referrals.status, status as string));
      }

      // Apply search filter if provided
      if (search) {
        query = query.where(
          or(
            like(referrals.candidateName, `%${search}%`),
            like(referrals.candidateEmail, `%${search}%`),
            like(referrals.position, `%${search}%`)
          )
        );
      }

      const referralsList = await query
        .orderBy(desc(referrals.createdAt))
        .limit(Number(limit))
        .offset(offset);

      res.json(referralsList);
    } catch (error) {
      res.status(500).send("Failed to fetch referrals");
    }
  });

  app.get("/api/referrals/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const [referral] = await db
        .select()
        .from(referrals)
        .where(eq(referrals.id, parseInt(req.params.id)));

      if (!referral) {
        return res.status(404).send("Referral not found");
      }

      // Check if user has access to this referral
      if (req.user.role === 'clinician' && referral.referrerId !== req.user.id) {
        return res.status(403).send("Access denied");
      }

      res.json(referral);
    } catch (error) {
      res.status(500).send("Failed to fetch referral");
    }
  });

  app.post("/api/referrals", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const [newReferral] = await db
        .insert(referrals)
        .values({
          ...req.body,
          referrerId: req.user.id,
          status: 'pending',
        })
        .returning();

      res.json(newReferral);
    } catch (error) {
      res.status(500).send("Failed to create referral");
    }
  });

  app.patch("/api/referrals/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    // Only recruiters and leadership can update referrals
    if (req.user.role === 'clinician') {
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
      res.status(500).send("Failed to update referral");
    }
  });

  // Rewards routes
  app.get("/api/rewards", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const userRewards = await db
        .select()
        .from(rewards)
        .where(eq(rewards.userId, req.user.id))
        .orderBy(desc(rewards.createdAt));
      res.json(userRewards);
    } catch (error) {
      res.status(500).send("Failed to fetch rewards");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}