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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
app.use(express.json());

// Initialize SQLite database
initDatabase();
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

const server = app.listen(PORT, () => {
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

export default app;
