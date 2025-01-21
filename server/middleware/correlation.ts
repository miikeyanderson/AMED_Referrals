import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}

export const correlationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Get correlation ID from header or generate new one
  const correlationId = req.header("X-Request-ID") || uuidv4();
  
  // Attach to request object for use in other middleware/routes
  req.correlationId = correlationId;
  
  // Set response header
  res.setHeader("X-Request-ID", correlationId);
  
  next();
};
