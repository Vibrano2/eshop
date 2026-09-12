// In-memory rate limiting middleware for sensitive endpoints
// Works without external dependencies (no Redis required), safe for standalone/container deployment

class MemoryRateLimiter {
  constructor(windowMs = 60 * 1000, maxRequests = 60, message = 'Trop de requêtes, veuillez réessayer plus tard.') {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.message = message;
    this.hits = new Map();

    // Periodic cleanup every 2 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.hits.entries()) {
        if (now - record.startTime > this.windowMs) {
          this.hits.delete(key);
        }
      }
    }, 2 * 60 * 1000);

    // Ensure timer doesn't prevent Node process from exiting
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  middleware() {
    return (req, res, next) => {
      // Extract client IP address (taking X-Forwarded-For into account if behind proxy)
      const forwarded = req.headers['x-forwarded-for'];
      const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress || '127.0.0.1';
      const key = `${ip}:${req.baseUrl || req.path}`;
      const now = Date.now();

      let record = this.hits.get(key);
      if (!record || now - record.startTime > this.windowMs) {
        record = { count: 1, startTime: now };
        this.hits.set(key, record);
      } else {
        record.count++;
      }

      const remaining = Math.max(0, this.maxRequests - record.count);
      const resetTime = Math.ceil((record.startTime + this.windowMs - now) / 1000);

      res.setHeader('X-RateLimit-Limit', this.maxRequests);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', resetTime);

      if (record.count > this.maxRequests) {
        res.setHeader('Retry-After', resetTime);
        return res.status(429).json({
          success: false,
          error: this.message,
          retryAfterSeconds: resetTime
        });
      }

      next();
    };
  }
}

// Pre-configured rate limiters for different sensitivity levels
export const authRateLimiter = new MemoryRateLimiter(
  15 * 60 * 1000, // 15 minutes window
  10,             // max 10 failed/successful attempts per 15 min per IP
  'Trop de tentatives d’authentification. Veuillez patienter 15 minutes avant de réessayer.'
).middleware();

export const orderRateLimiter = new MemoryRateLimiter(
  10 * 60 * 1000, // 10 minutes window
  15,             // max 15 orders created per 10 min per IP
  'Limite de création de commandes atteinte. Veuillez patienter quelques minutes.'
).middleware();

export const paymentRateLimiter = new MemoryRateLimiter(
  10 * 60 * 1000, // 10 minutes window
  12,             // max 12 payment attempts per 10 min per IP
  'Trop de tentatives de paiement. Veuillez réessayer dans quelques minutes.'
).middleware();

export const newsletterRateLimiter = new MemoryRateLimiter(
  10 * 60 * 1000, // 10 minutes window
  5,              // max 5 newsletter subscriptions per 10 min per IP
  'Trop de demandes d’inscription. Veuillez réessayer ultérieurement.'
).middleware();

export const reviewsRateLimiter = new MemoryRateLimiter(
  10 * 60 * 1000, // 10 minutes window
  10,             // max 10 reviews submitted per 10 min per IP
  'Trop d’avis soumis récemment. Veuillez patienter avant d’en publier un autre.'
).middleware();

export const generalApiRateLimiter = new MemoryRateLimiter(
  1 * 60 * 1000,  // 1 minute window
  120,            // max 120 API requests per minute per IP
  'Trop de requêtes vers le serveur. Ralentissez vos actions.'
).middleware();
