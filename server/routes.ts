import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { referrals, rewards } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Referral routes
  app.get("/api/referrals", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const allReferrals = await db
        .select()
        .from(referrals)
        .where(eq(referrals.referrerId, req.user.id));
      res.json(allReferrals);
    } catch (error) {
      res.status(500).send("Failed to fetch referrals");
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
        })
        .returning();
      res.json(newReferral);
    } catch (error) {
      res.status(500).send("Failed to create referral");
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
        .where(eq(rewards.userId, req.user.id));
      res.json(userRewards);
    } catch (error) {
      res.status(500).send("Failed to fetch rewards");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
