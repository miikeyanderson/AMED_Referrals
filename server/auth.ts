import passport from "passport";
import { IVerifyOptions, Strategy as LocalStrategy } from "passport-local";
import { type Express, type Request, type Response, type NextFunction } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { users, insertUserSchema, type InsertUser, type User } from "@db/schema";
import { db } from "@db";
import { eq } from "drizzle-orm";
import { logAuthFailure, logUnauthorizedAccess, logServerError } from "./utils/logger";

const scryptAsync = promisify(scrypt);
const crypto = {
  hash: async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  },
  compare: async (suppliedPassword: string, storedPassword: string) => {
    const [hashedPassword, salt] = storedPassword.split(".");
    const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
    const suppliedPasswordBuf = (await scryptAsync(
      suppliedPassword,
      salt,
      64
    )) as Buffer;
    return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
  },
};

declare global {
  namespace Express {
    interface User extends Omit<User, 'password'> {}
  }
}

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);
  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID || "arm-platform-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {},
    store: new MemoryStore({
      checkPeriod: 86400000,
    }),
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
    sessionSettings.cookie = {
      secure: true,
    };
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1);

        const ip = "0.0.0.0"; // In production, get from request

        if (!user) {
          logAuthFailure(username, ip, "Incorrect username");
          return done(null, false, { message: "Incorrect username." });
        }

        const isMatch = await crypto.compare(password, user.password);
        if (!isMatch) {
          logAuthFailure(username, ip, "Incorrect password");
          return done(null, false, { message: "Incorrect password." });
        }

        const { password: _, ...userWithoutPassword } = user;
        return done(null, userWithoutPassword);
      } catch (err) {
        logServerError(err as Error, { context: 'passport-local-strategy' });
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db
        .select({
          id: users.id,
          username: users.username,
          role: users.role,
          name: users.name,
          email: users.email
        })
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      done(null, user);
    } catch (err) {
      logServerError(err as Error, { context: 'passport-deserialize' });
      done(err);
    }
  });

  // Middleware to handle authentication errors
  const handleAuthError = (err: Error, req: Request, res: Response, next: NextFunction) => {
    logServerError(err, {
      context: 'auth-middleware',
      url: req.url,
      method: req.method,
    });
    next(err);
  };

  app.post("/api/register", async (req, res, next) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        const ip = req.ip || req.socket.remoteAddress || '0.0.0.0';
        logAuthFailure(
          req.body.username || 'unknown',
          ip,
          `Invalid registration input: ${result.error.issues.map(i => i.message).join(", ")}`
        );
        return res
          .status(400)
          .send("Invalid input: " + result.error.issues.map(i => i.message).join(", "));
      }

      const { username, password } = result.data;

      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (existingUser) {
        const ip = req.ip || req.socket.remoteAddress || '0.0.0.0';
        logAuthFailure(username, ip, "Username already exists");
        return res.status(400).send("Username already exists");
      }

      const hashedPassword = await crypto.hash(password);

      const [newUser] = await db
        .insert(users)
        .values({
          ...result.data,
          password: hashedPassword,
        })
        .returning();

      const { password: _, ...userWithoutPassword } = newUser;

      req.login(userWithoutPassword, (err) => {
        if (err) {
          logServerError(err, { context: 'register-login' });
          return next(err);
        }
        return res.json({ message: "Registration successful" });
      });
    } catch (error) {
      logServerError(error as Error, { context: 'register' });
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: IVerifyOptions | undefined) => {
      if (err) {
        logServerError(err, { context: 'login-auth' });
        return next(err);
      }

      if (!user) {
        const ip = req.ip || req.socket.remoteAddress || '0.0.0.0';
        logAuthFailure(
          req.body.username || 'unknown',
          ip,
          info?.message || "Login failed"
        );
        return res.status(400).send(info?.message || "Login failed");
      }

      req.login(user, (err) => {
        if (err) {
          logServerError(err, { context: 'login-session' });
          return next(err);
        }
        return res.json({ message: "Login successful" });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        logServerError(err, { context: 'logout' });
        return res.status(500).send("Logout failed");
      }
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      return res.json(req.user);
    }

    const ip = req.ip || req.socket.remoteAddress || '0.0.0.0';
    logUnauthorizedAccess(
      -1, // No user ID for unauthenticated requests
      ip,
      '/api/user'
    );
    res.status(401).send("Not logged in");
  });

  // Add error handling middleware
  app.use(handleAuthError);
}