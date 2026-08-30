/**
 * Rate limiting middleware for auth endpoints
 */

const requestCounts = new Map();

export function createRateLimiter(windowMs = 900000, maxRequests = 5) {
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!requestCounts.has(key)) {
      requestCounts.set(key, []);
    }

    const requests = requestCounts.get(key).filter((time) => time > windowStart);
    requestCounts.set(key, requests);

    if (requests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Trop de tentatives. Réessayez dans quelques minutes.',
      });
    }

    requests.push(now);
    requestCounts.set(key, requests);
    next();
  };
}

// Cleanup old entries every hour to prevent memory leak
setInterval(() => {
  const now = Date.now();
  const oneHourAgo = now - 3600000;

  for (const [key, requests] of requestCounts.entries()) {
    const recentRequests = requests.filter((time) => time > oneHourAgo);
    if (recentRequests.length === 0) {
      requestCounts.delete(key);
    } else {
      requestCounts.set(key, recentRequests);
    }
  }
}, 3600000);

export default createRateLimiter;
