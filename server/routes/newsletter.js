import { Router } from 'express';
import { db } from '../db.js';
import { newsletterRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/newsletter
router.post('/', newsletterRateLimiter, (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'Adresse email invalide.' });
    }

    const normalized = email.trim().toLowerCase().slice(0, 100);

    // Check if already subscribed
    const existing = db.prepare('SELECT * FROM newsletter WHERE email = ?').get(normalized);
    if (existing) {
      return res.json({
        success: true,
        alreadySubscribed: true,
        promoCode: 'BIENVENUE10',
        message: 'Vous êtes déjà inscrit ! Profitez de votre code BIENVENUE10 (-10%).'
      });
    }

    db.prepare(`
      INSERT INTO newsletter (email, promo_code, created_at)
      VALUES (?, 'BIENVENUE10', datetime('now'))
    `).run(normalized);

    res.status(201).json({
      success: true,
      promoCode: 'BIENVENUE10',
      message: 'Inscription validée ! Voici votre code de bienvenue : BIENVENUE10 (-10%).'
    });
  } catch (err) {
    console.error('Error subscribing to newsletter:', err);
    res.status(500).json({ success: false, error: 'Erreur lors de l’inscription.' });
  }
});

export default router;
