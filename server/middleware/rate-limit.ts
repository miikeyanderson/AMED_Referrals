import rateLimit from 'express-rate-limit';

// Create a limiter middleware
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again after 15 minutes',
    limitReached: true
  },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: (ip) => {
    // Only trust Replit's proxy
    return ip === '127.0.0.1' || ip.startsWith('172.'); 
  },
  // Add request timestamp for monitoring
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Too many requests from this IP, please try again after 15 minutes',
      limitReached: true,
      timestamp: new Date().toISOString()
    });
  }
});

// Export a monitoring middleware to track request counts
export const requestMonitor = {
  requestCounts: new Map<string, number>(),
  resetTime: Date.now() + (15 * 60 * 1000),
  
  middleware: (req: any, res: any, next: any) => {
    const ip = req.ip;
    const currentCount = requestMonitor.requestCounts.get(ip) || 0;
    requestMonitor.requestCounts.set(ip, currentCount + 1);
    
    // Attach monitoring data to the request for the dashboard
    req.rateLimit = {
      currentCount: currentCount + 1,
      limit: 100,
      remaining: Math.max(0, 100 - (currentCount + 1)),
      resetTime: requestMonitor.resetTime
    };
    
    next();
  }
};

// Reset counts every 15 minutes
setInterval(() => {
  requestMonitor.requestCounts.clear();
  requestMonitor.resetTime = Date.now() + (15 * 60 * 1000);
}, 15 * 60 * 1000);
