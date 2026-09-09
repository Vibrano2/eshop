import express from 'express';
import cors from 'cors';
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

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Initialize SQLite database
initDatabase();
seedInitialReviews();

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'eshop-store.eu backend API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
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

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ success: false, error: 'Erreur interne du serveur' });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 eshop-store.eu backend API running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   Products API: http://localhost:${PORT}/api/products`);
  console.log(`   Orders API:   http://localhost:${PORT}/api/orders`);
  console.log(`====================================================`);
});

export default app;
