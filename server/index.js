import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDatabase } from './db.js';

import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import loyaltyRouter from './routes/loyalty.js';
import promoRouter from './routes/promo.js';
import newsletterRouter from './routes/newsletter.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import paymentRouter from './routes/payment.js';
import reviewsRouter, { seedInitialReviews } from './routes/reviews.js';
import { syncCatalog } from './services/catalogSync.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

// Load environment variables from .env if present
try {
  if (typeof process.loadEnvFile === 'function') {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      process.loadEnvFile(envPath);
    }
  }
} catch (envErr) {
  // Silent catch if .env is missing or already defined in environment
}

import { securityHeaders } from './middleware/securityHeaders.js';
import { generalApiRateLimiter } from './middleware/rateLimiter.js';

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security Headers
app.use(securityHeaders);

// CORS configuration with credentials support
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((u) => u.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3001', 'https://eshopstore.shop'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, origin);
      }
      if (NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, origin);
      }
      return callback(null, origin);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Body parser with 1MB safety limit and rawBody capture for webhook signature verification
app.use(
  express.json({
    limit: '1mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    }
  })
);

// General rate limiter for /api routes
app.use('/api', generalApiRateLimiter);

// Initialize SQLite database and sync authoritative catalog
initDatabase();
syncCatalog();
seedInitialReviews();

// Health Check with system metrics
app.get('/api/health', (req, res) => {
  const memory = process.memoryUsage();
  res.json({
    status: 'ok',
    service: 'eshopstore.shop unified API & server',
    version: '1.0.0',
    environment: NODE_ENV,
    uptime: Math.floor(process.uptime()),
    memory: {
      rss: `${Math.round(memory.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)}MB`
    },
    staticDistServing: fs.existsSync(distPath),
    timestamp: new Date().toISOString()
  });
});

// Mount API Routes
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/products', productsRouter);
app.use('/api/products', reviewsRouter);
app.use('/api', reviewsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/loyalty', loyaltyRouter);
app.use('/api/promo', promoRouter);
app.use('/api/newsletter', newsletterRouter);

// 404 Handler for undefined /api routes
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint API introuvable' });
});

// Serve compiled Vite production frontend if dist exists
if (fs.existsSync(distPath)) {
  console.log(`📦 Serving static frontend from: ${distPath}`);
  app.use(express.static(distPath));

  // SPA Fallback: Any non-API route returns index.html for React router / SPA
  app.use((req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ success: false, error: 'Erreur interne du serveur' });
});

const isMainModule = process.argv[1] && (
  process.argv[1].endsWith('server/index.js') ||
  process.argv[1].endsWith('server\\index.js')
);

let server = null;
if (isMainModule) {
  server = app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 eshopstore.shop unified server running on port ${PORT}`);
    console.log(`   Environment:  ${NODE_ENV}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
    console.log(`   API routes:   http://localhost:${PORT}/api/products`);
    if (fs.existsSync(distPath)) {
      console.log(`   Frontend SPA: http://localhost:${PORT}/ (serving dist)`);
    }
    console.log(`====================================================`);
  });

  // Graceful shutdown handling
  const gracefulShutdown = (signal) => {
    console.log(`\n🛑 Received ${signal}. Closing HTTP server gracefully...`);
    server.close(() => {
      console.log('✅ HTTP server closed cleanly. Database connections safely released.');
      process.exit(0);
    });
    setTimeout(() => {
      console.error('⚠️ Forcefully terminating server after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

export default app;
